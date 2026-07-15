import api from './api';

export interface UploadTaskState {
  id: string;
  file: File;
  parentPath: string;
  progress: number; // 0 to 100
  speed: string;    // e.g. "4.5 MB/s"
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error' | 'cancelled';
  error?: string;
}

type ProgressCallback = (tasks: UploadTaskState[]) => void;

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB per chunk

class UploadService {
  private tasks: Map<string, UploadTaskState> = new Map();
  private listeners: Set<ProgressCallback> = new Set();
  private abortControllers: Map<string, AbortController> = new Map();

  public subscribe(callback: ProgressCallback): () => void {
    this.listeners.add(callback);
    callback(this.getTasks());
    return () => this.listeners.delete(callback);
  }

  private notify() {
    const taskArray = this.getTasks();
    this.listeners.forEach((listener) => listener(taskArray));
  }

  public getTasks(): UploadTaskState[] {
    return Array.from(this.tasks.values());
  }

  public async addFile(file: File, parentPath: string = '/') {
    // Unique ID based on filename, size, lastModified and timestamp
    const id = `upload_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}_${file.size}_${file.lastModified}`;
    
    if (this.tasks.has(id)) {
      const existing = this.tasks.get(id)!;
      if (existing.status === 'uploading' || existing.status === 'completed') {
        return;
      }
    }

    const task: UploadTaskState = {
      id,
      file,
      parentPath,
      progress: 0,
      speed: '0 KB/s',
      status: 'pending'
    };

    this.tasks.set(id, task);
    this.notify();
    this.startOrResume(id);
  }

  public async startOrResume(id: string) {
    const task = this.tasks.get(id);
    if (!task || (task.status === 'uploading' && this.abortControllers.has(id))) return;

    task.status = 'uploading';
    task.error = undefined;
    this.notify();

    const controller = new AbortController();
    this.abortControllers.set(id, controller);

    try {
      const totalChunks = Math.ceil(task.file.size / CHUNK_SIZE);
      
      // Step 1: Check existing uploaded chunks to resume automatically
      let uploadedChunks: number[] = [];
      try {
        const statusRes = await api.get(`/files/upload/status?uploadId=${id}`, {
          signal: controller.signal
        });
        if (statusRes.data.success && Array.isArray(statusRes.data.uploadedChunks)) {
          uploadedChunks = statusRes.data.uploadedChunks;
        }
      } catch (e: any) {
        if (e.name === 'CanceledError' || controller.signal.aborted) return;
        // If status check fails, proceed with empty set
      }

      const uploadedSet = new Set(uploadedChunks);
      let bytesUploaded = uploadedSet.size * CHUNK_SIZE;
      if (bytesUploaded > task.file.size) bytesUploaded = task.file.size;

      let lastTimestamp = Date.now();
      let lastBytes = bytesUploaded;

      // Step 2: Upload missing chunks
      for (let i = 0; i < totalChunks; i++) {
        if (controller.signal.aborted || task.status !== 'uploading') {
          return;
        }

        if (uploadedSet.has(i)) {
          continue;
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, task.file.size);
        const chunkBlob = task.file.slice(start, end);

        const formData = new FormData();
        formData.append('uploadId', id);
        formData.append('chunkIndex', i.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('file', chunkBlob, task.file.name);

        const startTime = Date.now();
        await api.post('/files/upload/chunk', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          signal: controller.signal,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.loaded && progressEvent.total) {
              const currentChunkLoaded = progressEvent.loaded;
              const totalLoaded = bytesUploaded + currentChunkLoaded;
              task.progress = Math.min(Math.round((totalLoaded / task.file.size) * 100), 99);

              const now = Date.now();
              const timeDiff = (now - startTime) / 1000;
              if (timeDiff > 0.3) {
                const speedBps = currentChunkLoaded / timeDiff;
                task.speed = this.formatSpeed(speedBps);
              }
              this.notify();
            }
          }
        });

        bytesUploaded += (end - start);
        task.progress = Math.min(Math.round((bytesUploaded / task.file.size) * 100), 99);
        
        const now = Date.now();
        const timeDiff = (now - lastTimestamp) / 1000;
        if (timeDiff > 0.5) {
          const speedBps = (bytesUploaded - lastBytes) / timeDiff;
          task.speed = this.formatSpeed(speedBps);
          lastTimestamp = now;
          lastBytes = bytesUploaded;
        }
        this.notify();
      }

      if (controller.signal.aborted || task.status !== 'uploading') return;

      // Step 3: Complete upload assembly on server
      await api.post('/files/upload/complete', {
        uploadId: id,
        filename: task.file.name,
        parentPath: task.parentPath,
        totalChunks
      }, { signal: controller.signal });

      task.progress = 100;
      task.speed = 'Completed';
      task.status = 'completed';
      this.abortControllers.delete(id);
      this.notify();

      // Trigger global refresh so new file appears instantly in list
      window.dispatchEvent(new Event('files_updated'));
    } catch (err: any) {
      if (err.name === 'CanceledError' || controller.signal.aborted) {
        return;
      }
      task.status = 'error';
      task.error = err.response?.data?.error || err.message || 'Upload failed';
      task.speed = 'Failed';
      this.abortControllers.delete(id);
      this.notify();
    }
  }

  public pauseTask(id: string) {
    const task = this.tasks.get(id);
    if (!task || task.status !== 'uploading') return;

    const controller = this.abortControllers.get(id);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(id);
    }
    task.status = 'paused';
    task.speed = 'Paused';
    this.notify();
  }

  public cancelTask(id: string) {
    const task = this.tasks.get(id);
    if (!task) return;

    const controller = this.abortControllers.get(id);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(id);
    }
    task.status = 'cancelled';
    this.tasks.delete(id);
    this.notify();
  }

  public clearCompleted() {
    for (const [id, task] of this.tasks.entries()) {
      if (task.status === 'completed' || task.status === 'cancelled' || task.status === 'error') {
        this.tasks.delete(id);
      }
    }
    this.notify();
  }

  private formatSpeed(bytesPerSec: number): string {
    if (bytesPerSec > 1024 * 1024) {
      return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
    }
    if (bytesPerSec > 1024) {
      return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
    }
    return `${bytesPerSec.toFixed(0)} B/s`;
  }
}

export const uploadService = new UploadService();
