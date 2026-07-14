import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import {
  HardDrive,
  ShieldCheck,
  BookOpen,
  Terminal,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { TopBar } from './components/layout/TopBar';
import { NavRail } from './components/layout/NavRail';
import { LoginModal } from './components/auth/LoginModal';
import { Breadcrumbs } from './components/files/Breadcrumbs';
import { FileTable, FileItem } from './components/files/FileTable';
import { DeleteDialog } from './components/files/DeleteDialog';
import { NewFolderDialog } from './components/files/NewFolderDialog';
import { UploadProgress } from './components/files/UploadProgress';
import { SkeletonLoader } from './components/common/SkeletonLoader';
import api from './services/api';
import { uploadService } from './services/uploadService';

export const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('pocketcloud_token'));
  });
  const [loginOpen, setLoginOpen] = useState<boolean>(!isLoggedIn);
  const [activeTab, setActiveTab] = useState<'files' | 'storage' | 'docs'>('files');

  // File Manager State
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

  // Dialogs
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    item?: FileItem;
    isBulk: boolean;
  }>({ open: false, isBulk: false });
  const [newFolderOpen, setNewFolderOpen] = useState<boolean>(false);

  // Hidden File Input for clicking "Upload Files" in NavRail
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Notifications
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const verifyAuthAndLoad = async (path: string = currentPath) => {
    if (!localStorage.getItem('pocketcloud_token')) {
      setIsLoggedIn(false);
      setLoginOpen(true);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/files/list?path=${encodeURIComponent(path)}`);
      if (res.data.success) {
        setItems(res.data.items || []);
        setCurrentPath(res.data.currentPath || '/');
        setSelectedPaths([]);
      }
    } catch (err: any) {
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        showNotification(err.response?.data?.error || 'Failed to load directory contents', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      verifyAuthAndLoad('/');
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleAuthExpired = () => {
      setIsLoggedIn(false);
      setLoginOpen(true);
      showNotification('Your session has expired or token is invalid. Please log in.', 'warning');
    };

    const handleFilesUpdated = () => {
      if (isLoggedIn) {
        verifyAuthAndLoad(currentPath);
      }
    };

    window.addEventListener('auth_expired', handleAuthExpired);
    window.addEventListener('files_updated', handleFilesUpdated);
    return () => {
      window.removeEventListener('auth_expired', handleAuthExpired);
      window.removeEventListener('files_updated', handleFilesUpdated);
    };
  }, [isLoggedIn, currentPath]);

  // Filtered items based on Search Bar query
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, searchQuery]);

  const handleLoginSuccess = (_token: string) => {
    setIsLoggedIn(true);
    setLoginOpen(false);
    showNotification('Welcome back! Server access unlocked.', 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('pocketcloud_token');
    localStorage.removeItem('pocketcloud_user');
    setIsLoggedIn(false);
    setLoginOpen(true);
    showNotification('Logged out successfully.', 'info');
  };

  const handleOpenFolder = (path: string) => {
    verifyAuthAndLoad(path);
  };

  const handleCreateFolder = async (name: string): Promise<boolean> => {
    try {
      const res = await api.post('/files/folder', { parentPath: currentPath, name });
      if (res.data.success) {
        showNotification(`Folder "${name}" created successfully.`, 'success');
        verifyAuthAndLoad(currentPath);
        return true;
      }
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to create folder', 'error');
    }
    return false;
  };

  const handleRenameItem = async (item: FileItem, newName: string): Promise<boolean> => {
    try {
      const res = await api.put('/files/rename', { oldPath: item.path, newName });
      if (res.data.success) {
        showNotification(`Renamed to "${newName}"`, 'success');
        verifyAuthAndLoad(currentPath);
        return true;
      }
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Rename failed', 'error');
    }
    return false;
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteDialog.isBulk) {
        const res = await api.post('/files/bulk-delete', { paths: selectedPaths });
        if (res.data.success) {
          showNotification(`Deleted ${res.data.deleted.length} items.`, 'success');
          setSelectedPaths([]);
          verifyAuthAndLoad(currentPath);
        }
      } else if (deleteDialog.item) {
        const res = await api.delete(`/files/delete?path=${encodeURIComponent(deleteDialog.item.path)}`);
        if (res.data.success) {
          showNotification(`Deleted "${deleteDialog.item.name}"`, 'success');
          verifyAuthAndLoad(currentPath);
        }
      }
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Deletion failed', 'error');
    } finally {
      setDeleteDialog({ open: false, isBulk: false });
    }
  };

  const handleDownloadItem = (item: FileItem) => {
    const token = localStorage.getItem('pocketcloud_token') || '';
    const url = `/api/files/download?path=${encodeURIComponent(item.path)}&token=${encodeURIComponent(token)}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', item.name);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDropFiles = (fileList: FileList) => {
    for (let i = 0; i < fileList.length; i++) {
      uploadService.addFile(fileList[i], currentPath);
    }
    showNotification(`Queued ${fileList.length} file(s) for chunked upload.`, 'info');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onLogout={handleLogout}
        isLoggedIn={isLoggedIn}
      />

      <Box sx={{ display: 'flex', flex: 1, flexDirection: { xs: 'column', md: 'row' } }}>
        <NavRail
          onOpenUpload={() => fileInputRef.current?.click()}
          onOpenNewFolder={() => setNewFolderOpen(true)}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, overflowX: 'hidden' }}>
          {activeTab === 'files' && (
            <>
              <Breadcrumbs currentPath={currentPath} onNavigate={handleOpenFolder} />

              {loading ? (
                <SkeletonLoader />
              ) : (
                <FileTable
                  items={filteredItems}
                  selectedPaths={selectedPaths}
                  onSelectAll={(checked) => {
                    setSelectedPaths(checked ? filteredItems.map((i) => i.path) : []);
                  }}
                  onSelectItem={(path, checked) => {
                    setSelectedPaths((prev) =>
                      checked ? [...prev, path] : prev.filter((p) => p !== path)
                    );
                  }}
                  onOpenFolder={handleOpenFolder}
                  onDownloadItem={handleDownloadItem}
                  onRenameItem={handleRenameItem}
                  onDeleteItem={(item) => setDeleteDialog({ open: true, item, isBulk: false })}
                  onBulkDelete={() => setDeleteDialog({ open: true, isBulk: true })}
                  onDropFiles={handleDropFiles}
                />
              )}
            </>
          )}

          {activeTab === 'storage' && (
            <Box sx={{ maxWidth: 840, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Storage & SD Card Configuration
              </Typography>
              <Paper sx={{ p: 3, borderRadius: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <HardDrive size={32} color="#6750A4" />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Current Termux Storage Root
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Configured via `STORAGE_ROOT` in your `.env` file on the tablet.
                    </Typography>
                  </Box>
                </Box>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        INTERNAL MEMORY DEFAULT
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5, fontFamily: 'monospace' }}>
                        ./uploads or ~/storage/shared/PocketCloud
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        EXTERNAL MICRO SD CARD
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5, fontFamily: 'monospace' }}>
                        /storage/XXXX-XXXX/Android/data/com.termux/files
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}

          {activeTab === 'docs' && (
            <Box sx={{ maxWidth: 840, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Termux 24/7 Operations Guide
              </Typography>
              <Paper sx={{ p: 3, borderRadius: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Terminal size={28} color="#6750A4" />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Quick Commands for Termux
                  </Typography>
                </Box>
                <Box
                  component="pre"
                  sx={{
                    p: 2,
                    bgcolor: 'surface.containerLow',
                    borderRadius: 3,
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    overflowX: 'auto'
                  }}
                >
{`# 1. Start Server & Ngrok Tunnel 24/7 (with CPU Wakelock)
bash scripts/start-server.sh

# 2. Stop Server and Release Wakelock
bash scripts/stop-server.sh

# 3. Generate New Admin Password Hash
node scripts/hash-password.js your_secure_password`}
                </Box>
              </Paper>
            </Box>
          )}
        </Box>
      </Box>

      {/* Hidden File Picker Input */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleDropFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Modals & Dialogs */}
      <LoginModal open={loginOpen} onLoginSuccess={handleLoginSuccess} />
      <DeleteDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, isBulk: false })}
        onConfirm={handleConfirmDelete}
        targetName={deleteDialog.item?.name || ''}
        isBulk={deleteDialog.isBulk}
        count={selectedPaths.length}
      />
      <NewFolderDialog
        open={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        onCreate={handleCreateFolder}
      />
      <UploadProgress />

      {/* Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontWeight: 500 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
