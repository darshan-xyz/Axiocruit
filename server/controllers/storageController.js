/**
 * Enterprise Storage Controller
 * Handles presigned URL negotiation and streaming storage endpoints
 * Author: Axiocruit Enterprise Integration Platform
 */

const fs = require('fs');
const path = require('path');
const storageService = require('../services/storageService');
const { isAdminRole, isOrgAdminRole } = require('../schemas/roleTaxonomy');

const ALLOWED_MIME_TYPES = {
  resumes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  avatars: ['image/jpeg', 'image/png', 'image/webp'],
  recordings: ['video/webm', 'video/mp4'],
  artifacts: ['application/json', 'text/plain', 'application/pdf'],
};

const MAX_SIZE_BYTES = {
  resumes: 10 * 1024 * 1024, // 10MB
  avatars: 5 * 1024 * 1024, // 5MB
  recordings: 100 * 1024 * 1024, // 100MB
  artifacts: 20 * 1024 * 1024, // 20MB
};

/**
 * POST /api/storage/presigned-upload
 * Generate presigned direct upload URL
 */
const requestPresignedUpload = async (req, res) => {
  try {
    const { filename, mimeType, category = 'resumes' } = req.body;

    if (!filename || !mimeType) {
      return res.status(400).json({ message: 'Both filename and mimeType are required' });
    }

    const cleanCategory = String(category).toLowerCase();
    const allowedMimes = ALLOWED_MIME_TYPES[cleanCategory] || ALLOWED_MIME_TYPES.resumes;

    if (!allowedMimes.includes(mimeType)) {
      return res.status(400).json({
        message: `MIME type '${mimeType}' is not allowed for category '${cleanCategory}'`,
        allowedTypes: allowedMimes,
      });
    }

    const maxSize = MAX_SIZE_BYTES[cleanCategory] || 10 * 1024 * 1024;
    const userId = String(req.user._id || req.user.id || 'anonymous');
    const fileKey = storageService.generateFileKey(cleanCategory, userId, filename);

    const presigned = storageService.generatePresignedUploadUrl({
      fileKey,
      mimeType,
      maxSizeBytes: maxSize,
      expiresInSeconds: 900, // 15 mins
    });

    return res.status(200).json({
      success: true,
      fileKey,
      category: cleanCategory,
      ...presigned,
    });
  } catch (err) {
    console.error('[Storage] requestPresignedUpload error:', err);
    return res.status(500).json({ message: 'Failed to generate presigned upload URL' });
  }
};

/**
 * POST /api/storage/presigned-download
 * Generate presigned temporary download URL
 */
const requestPresignedDownload = async (req, res) => {
  try {
    const { fileKey } = req.body;

    if (!fileKey || typeof fileKey !== 'string') {
      return res.status(400).json({ message: 'fileKey is required' });
    }

    // Access control: Ensure user has rights to access the file
    const userId = String(req.user._id || req.user.id);
    const isOwner = fileKey.includes(`/${userId}/`);
    const isPrivileged = isAdminRole(req.user.role) || isOrgAdminRole(req.user.role) || req.user.role === 'RECRUITER' || req.user.role === 'INTERVIEWER';

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to access this file' });
    }

    const presigned = storageService.generatePresignedDownloadUrl({
      fileKey,
      expiresInSeconds: 3600, // 1 hour
    });

    return res.status(200).json({
      success: true,
      ...presigned,
    });
  } catch (err) {
    console.error('[Storage] requestPresignedDownload error:', err);
    return res.status(500).json({ message: 'Failed to generate presigned download URL' });
  }
};

/**
 * POST /api/storage/local-upload/:token
 * Endpoint for local driver streaming direct uploads
 */
const handleLocalUpload = async (req, res) => {
  try {
    const { token } = req.params;
    const verified = storageService._verifyLocalToken(token);

    if (!verified.valid) {
      return res.status(403).json({ message: `Invalid or expired upload token: ${verified.error}` });
    }

    const { fileKey, mimeType, maxSizeBytes } = verified.payload;

    // Buffer incoming binary stream
    const chunks = [];
    let bytesReceived = 0;

    req.on('data', (chunk) => {
      bytesReceived += chunk.length;
      if (bytesReceived > maxSizeBytes) {
        req.destroy();
        return res.status(413).json({ message: `Upload payload exceeds size limit of ${maxSizeBytes} bytes` });
      }
      chunks.push(chunk);
    });

    req.on('end', async () => {
      if (res.headersSent) return;

      const buffer = Buffer.concat(chunks);
      if (buffer.length === 0) {
        return res.status(400).json({ message: 'Empty upload body' });
      }

      // Magic byte verification
      const isPdf = buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // %PDF
      const isPng = buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
      const isJpg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      const isZip = buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b; // PK (docx)

      let validBytes = false;
      if (mimeType === 'application/pdf' && isPdf) validBytes = true;
      else if (mimeType.includes('image/png') && isPng) validBytes = true;
      else if (mimeType.includes('image/jpeg') && isJpg) validBytes = true;
      else if (mimeType.includes('wordprocessingml') && isZip) validBytes = true;
      else if (mimeType.includes('video/') || mimeType.includes('text/')) validBytes = true; // passthrough for streaming types

      if (!validBytes) {
        return res.status(400).json({ message: 'File signature does not match declared MIME type' });
      }

      await storageService.saveBuffer(fileKey, buffer);

      return res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        fileKey,
        bytesWritten: buffer.length,
      });
    });

    req.on('error', (err) => {
      if (!res.headersSent) {
        return res.status(500).json({ message: `Stream ingestion error: ${err.message}` });
      }
    });
  } catch (err) {
    console.error('[Storage] handleLocalUpload error:', err);
    return res.status(500).json({ message: 'Internal server error processing local upload' });
  }
};

/**
 * GET /api/storage/local-download/:token
 * Endpoint for local driver authenticated streaming downloads
 */
const handleLocalDownload = async (req, res) => {
  try {
    const { token } = req.params;
    const verified = storageService._verifyLocalToken(token);

    if (!verified.valid) {
      return res.status(403).json({ message: `Invalid or expired download token: ${verified.error}` });
    }

    const { fileKey } = verified.payload;
    const filePath = storageService.resolveLocalPath(fileKey);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found in storage' });
    }

    const ext = path.extname(fileKey).toLowerCase();
    const mimeMap = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
    };

    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (err) {
    console.error('[Storage] handleLocalDownload error:', err);
    return res.status(500).json({ message: 'Internal server error streaming file' });
  }
};

module.exports = {
  requestPresignedUpload,
  requestPresignedDownload,
  handleLocalUpload,
  handleLocalDownload,
};
