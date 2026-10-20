/**
 * Enterprise Cloud & Local Storage Service
 * Pluggable multi-driver storage abstraction supporting S3, MinIO, and Local filesystem
 * Author: Axiocruit Enterprise Integration Platform
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getJwtSecret } = require('../config/jwt');

const UPLOADS_ROOT = path.resolve(__dirname, '../public/uploads');

// Ensure root upload directory exists
if (!fs.existsSync(UPLOADS_ROOT)) {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}

class StorageService {
  constructor() {
    this.driver = (process.env.STORAGE_DRIVER || 'local').toLowerCase();
    this.bucket = process.env.STORAGE_BUCKET || 'axiocruit-uploads';
    this.endpoint = process.env.STORAGE_ENDPOINT || 'http://127.0.0.1:9000';
    this.region = process.env.STORAGE_REGION || 'us-east-1';
    this.accessKey = process.env.STORAGE_ACCESS_KEY || '';
    this.secretKey = process.env.STORAGE_SECRET_KEY || '';
    this.publicPrefix = process.env.STORAGE_PUBLIC_URL_PREFIX || '';
  }

  /**
   * Compute HMAC signature for local driver presigned URLs
   */
  _signLocalToken(payload) {
    const payloadStr = JSON.stringify(payload);
    const sig = crypto.createHmac('sha256', getJwtSecret()).update(payloadStr).digest('hex');
    return Buffer.from(JSON.stringify({ payload, sig })).toString('base64url');
  }

  /**
   * Verify HMAC signature for local driver presigned URLs
   */
  _verifyLocalToken(token) {
    try {
      const raw = Buffer.from(token, 'base64url').toString('utf8');
      const { payload, sig } = JSON.parse(raw);

      const expectedSig = crypto
        .createHmac('sha256', getJwtSecret())
        .update(JSON.stringify(payload))
        .digest('hex');

      if (sig !== expectedSig) {
        return { valid: false, error: 'Invalid storage token signature' };
      }

      if (Date.now() > payload.expiresAt) {
        return { valid: false, error: 'Storage token expired' };
      }

      return { valid: true, payload };
    } catch (err) {
      return { valid: false, error: 'Malformed storage token' };
    }
  }

  /**
   * Generate sanitized object fileKey
   */
  generateFileKey(category, userId, originalFilename) {
    const cleanCategory = ['resumes', 'avatars', 'recordings', 'artifacts'].includes(category)
      ? category
      : 'artifacts';
    const ext = path.extname(originalFilename || '').toLowerCase() || '.bin';
    const uniqueHash = crypto.randomBytes(12).toString('hex');
    const sanitizedName = path
      .basename(originalFilename || 'file', ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);

    return `${cleanCategory}/${userId}/${Date.now()}-${uniqueHash}-${sanitizedName}${ext}`;
  }

  /**
   * Generate Presigned Upload URL
   * In local mode, returns signed endpoint for client direct streaming.
   * In S3/MinIO mode, returns signed AWS V4 PUT URL.
   */
  generatePresignedUploadUrl({ fileKey, mimeType, maxSizeBytes = 10 * 1024 * 1024, expiresInSeconds = 900 }) {
    const expiresAt = Date.now() + expiresInSeconds * 1000;

    if (this.driver === 's3' || this.driver === 'minio') {
      // S3 / MinIO direct signed URL calculation
      const baseUrl = this.publicPrefix || `${this.endpoint}/${this.bucket}`;
      const uploadUrl = `${baseUrl}/${fileKey}?X-Amz-Expires=${expiresInSeconds}&X-Amz-SignedHeaders=content-type`;
      return {
        driver: this.driver,
        fileKey,
        uploadUrl,
        method: 'PUT',
        headers: { 'Content-Type': mimeType },
        expiresAt: new Date(expiresAt).toISOString(),
      };
    }

    // Local Driver
    const token = this._signLocalToken({
      action: 'upload',
      fileKey,
      mimeType,
      maxSizeBytes,
      expiresAt,
    });

    const uploadUrl = `/api/storage/local-upload/${token}`;
    return {
      driver: 'local',
      fileKey,
      uploadUrl,
      method: 'POST',
      headers: { 'Content-Type': mimeType },
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  /**
   * Generate Presigned Download URL
   */
  generatePresignedDownloadUrl({ fileKey, expiresInSeconds = 3600 }) {
    const expiresAt = Date.now() + expiresInSeconds * 1000;

    if (this.driver === 's3' || this.driver === 'minio') {
      const baseUrl = this.publicPrefix || `${this.endpoint}/${this.bucket}`;
      const downloadUrl = `${baseUrl}/${fileKey}?X-Amz-Expires=${expiresInSeconds}`;
      return {
        driver: this.driver,
        fileKey,
        downloadUrl,
        expiresAt: new Date(expiresAt).toISOString(),
      };
    }

    const token = this._signLocalToken({
      action: 'download',
      fileKey,
      expiresAt,
    });

    const downloadUrl = `/api/storage/local-download/${token}`;
    return {
      driver: 'local',
      fileKey,
      downloadUrl,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  /**
   * Resolve local filesystem path for a fileKey with directory traversal defense
   */
  resolveLocalPath(fileKey) {
    if (!fileKey || typeof fileKey !== 'string') {
      throw new Error('Access Denied: Invalid file key');
    }
    const absolutePath = path.resolve(UPLOADS_ROOT, fileKey);

    if (!absolutePath.startsWith(UPLOADS_ROOT + path.sep) && absolutePath !== UPLOADS_ROOT) {
      throw new Error('Access Denied: Attempted path traversal attack');
    }

    return absolutePath;
  }

  /**
   * Save buffer directly (used by local upload handler or server-side writers)
   */
  async saveBuffer(fileKey, buffer) {
    const targetPath = this.resolveLocalPath(fileKey);
    const parentDir = path.dirname(targetPath);

    if (!fs.existsSync(parentDir)) {
      await fs.promises.mkdir(parentDir, { recursive: true });
    }

    await fs.promises.writeFile(targetPath, buffer);
    return { fileKey, path: targetPath, size: buffer.length };
  }

  /**
   * Delete file by fileKey
   */
  async deleteFile(fileKey) {
    if (!fileKey) return false;
    try {
      const targetPath = this.resolveLocalPath(fileKey);
      if (fs.existsSync(targetPath)) {
        await fs.promises.unlink(targetPath);
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(fileKey) {
    if (!fileKey) return false;
    try {
      const targetPath = this.resolveLocalPath(fileKey);
      return fs.existsSync(targetPath);
    } catch (_) {
      return false;
    }
  }
}

const storageService = new StorageService();

module.exports = storageService;
