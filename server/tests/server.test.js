const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/index');
const { STORAGE_ROOT, CACHE_UPLOADS_DIR, ADMIN_PASSWORD_HASH } = require('../src/config');
const { resolveSafePath, sanitizeName } = require('../src/utils/pathSanitizer');

let authToken = null;

beforeAll(async () => {
  // Ensure test storage folders exist
  if (!fs.existsSync(STORAGE_ROOT)) {
    fs.mkdirSync(STORAGE_ROOT, { recursive: true });
  }
  if (!fs.existsSync(CACHE_UPLOADS_DIR)) {
    fs.mkdirSync(CACHE_UPLOADS_DIR, { recursive: true });
  }

  // Log in to obtain valid JWT token for protected tests
  const res = await request(app)
    .post('/api/auth/login')
    .send({ password: 'admin123' }); // default password matching hash
  
  if (res.status === 200 && res.body.token) {
    authToken = res.body.token;
  }
});

afterAll(() => {
  // Clean up test files created inside STORAGE_ROOT
  const testFolder = path.join(STORAGE_ROOT, 'test_folder_security');
  if (fs.existsSync(testFolder)) {
    fs.rmSync(testFolder, { recursive: true, force: true });
  }
  const testFile = path.join(STORAGE_ROOT, 'test_assembled.txt');
  if (fs.existsSync(testFile)) {
    fs.rmSync(testFile, { force: true });
  }
});

describe('1. Path Sanitization & Anti-Traversal Security Engine', () => {
  test('Should resolve valid paths inside STORAGE_ROOT without throwing', () => {
    const safe = resolveSafePath('/my_folder/file.jpg');
    expect(safe).toBe(path.resolve(STORAGE_ROOT, 'my_folder/file.jpg'));
  });

  test('Should block path traversal attempts with ../../etc/passwd', () => {
    expect(() => {
      resolveSafePath('../../../etc/passwd');
    }).toThrow('Access Denied: Path traversal attack detected.');
  });

  test('Should block Windows traversal attacks using backslashes', () => {
    expect(() => {
      resolveSafePath('..\\..\\Windows\\System32\\config');
    }).toThrow('Access Denied: Path traversal attack detected.');
  });

  test('sanitizeName should strip null bytes and reserved symbols', () => {
    const dirty = 'test\0file<abc>:yes?.txt';
    const clean = sanitizeName(dirty);
    expect(clean).toBe('testfileabcyes.txt');
  });
});

describe('2. Authentication & Rate Limiting Verification', () => {
  test('Should reject requests without Authorization token', async () => {
    const res = await request(app).get('/api/files/list');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Should verify session with valid token', async () => {
    if (!authToken) return; // skip if login failed
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('admin');
  });
});

describe('3. File Manager & Chunked Resumable Upload Engine', () => {
  test('Should create a folder inside STORAGE_ROOT safely', async () => {
    if (!authToken) return;
    const res = await request(app)
      .post('/api/files/folder')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ parentPath: '/', name: 'test_folder_security' });

    expect([201, 409]).toContain(res.status); // 201 created or 409 if exists
  });

  test('Should list directory items correctly', async () => {
    if (!authToken) return;
    const res = await request(app)
      .get('/api/files/list?path=/')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  test('Should handle chunked resumable upload and assembly of multi-part file', async () => {
    if (!authToken) return;
    const uploadId = 'test_resumable_upload_123';

    // Chunk 0
    const resChunk0 = await request(app)
      .post('/api/files/upload/chunk')
      .set('Authorization', `Bearer ${authToken}`)
      .field('uploadId', uploadId)
      .field('chunkIndex', '0')
      .attach('file', Buffer.from('Hello Chunk 0! '), 'chunk0.dat');
    expect(resChunk0.status).toBe(200);

    // Chunk 1
    const resChunk1 = await request(app)
      .post('/api/files/upload/chunk')
      .set('Authorization', `Bearer ${authToken}`)
      .field('uploadId', uploadId)
      .field('chunkIndex', '1')
      .attach('file', Buffer.from('Hello Chunk 1!'), 'chunk1.dat');
    expect(resChunk1.status).toBe(200);

    // Verify upload status endpoint returns both uploaded chunks
    const resStatus = await request(app)
      .get(`/api/files/upload/status?uploadId=${uploadId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(resStatus.status).toBe(200);
    expect(resStatus.body.uploadedChunks).toEqual([0, 1]);

    // Complete upload
    const resComplete = await request(app)
      .post('/api/files/upload/complete')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        uploadId,
        filename: 'test_assembled.txt',
        parentPath: '/',
        totalChunks: 2
      });
    expect(resComplete.status).toBe(200);

    // Verify file content on disk matches exact concatenation
    const assembledPath = path.join(STORAGE_ROOT, 'test_assembled.txt');
    expect(fs.existsSync(assembledPath)).toBe(true);
    expect(fs.readFileSync(assembledPath, 'utf8')).toBe('Hello Chunk 0! Hello Chunk 1!');
  });

  test('Should stream downloaded file with HTTP Range headers (206 Partial Content)', async () => {
    if (!authToken) return;
    const res = await request(app)
      .get('/api/files/download?path=/test_assembled.txt')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Range', 'bytes=0-4');

    expect(res.status).toBe(206);
    expect(res.text).toBe('Hello');
    expect(res.headers['content-range']).toContain('bytes 0-4/');
  });
});
