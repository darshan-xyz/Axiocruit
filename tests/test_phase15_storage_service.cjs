/**
 * Axiocruit Enterprise Integration Test Harness
 * Phase 15: Enterprise Cloud Storage Abstraction & Presigned Upload Engine
 */

const path = require('path');
module.paths.push(path.resolve(__dirname, '../server/node_modules'));

const assert = require('assert');
const fs = require('fs');
const { Readable } = require('stream');

const storageService = require('../server/services/storageService');
const storageController = require('../server/controllers/storageController');

let totalTests = 0;

const it = async (name, fn) => {
  try {
    await fn();
    console.log(`  ✔ PASS: ${name}`);
  } catch (err) {
    console.error(`  ✖ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
};

const describe = async (name, fn) => {
  console.log(`\n● Suite: ${name}`);
  await fn();
};

const createMockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(k, v) {
      this.headers[k.toLowerCase()] = v;
      return this;
    },
    json(data) {
      this.body = data;
      this.headersSent = true;
      return this;
    },
    send(data) {
      this.body = data;
      this.headersSent = true;
      return this;
    },
  };
  return res;
};

async function runPhase15Tests() {
  console.log('========================================================================');
  console.log('  AXIOCRUIT PHASE 15: ENTERPRISE CLOUD STORAGE & PRESIGNED URL HARNESS   ');
  console.log('========================================================================');

  let generatedFileKey = '';
  let generatedUploadToken = '';

  try {
    await describe('Suite 1: Storage Driver Key Generation & Presigned URL Negotiation', async () => {
      await it('Generates partitioned, sanitized fileKey with category and user directory', async () => {
        totalTests++;
        const fileKey = storageService.generateFileKey('resumes', 'user-abc-123', 'My Resume (2026).pdf');
        assert(fileKey.startsWith('resumes/user-abc-123/'), 'Key is partitioned by category and userId');
        assert(fileKey.endsWith('.pdf'), 'Preserves valid extension');
        assert(!fileKey.includes(' '), 'Spaces sanitized to underscores');
        generatedFileKey = fileKey;
      });

      await it('Generates presigned upload URL with HMAC-signed token for local driver', async () => {
        totalTests++;
        const req = {
          user: { _id: 'user-abc-123', id: 'user-abc-123', role: 'CANDIDATE' },
          body: {
            filename: 'Candidate_CV.pdf',
            mimeType: 'application/pdf',
            category: 'resumes',
          },
        };
        const res = createMockRes();
        await storageController.requestPresignedUpload(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert(res.body.success);
        assert(res.body.uploadUrl.startsWith('/api/storage/local-upload/'));
        assert(res.body.fileKey.startsWith('resumes/user-abc-123/'));

        // Extract token
        generatedUploadToken = res.body.uploadUrl.split('/').pop();
      });

      await it('Rejects presigned upload requests for disallowed MIME types', async () => {
        totalTests++;
        const req = {
          user: { _id: 'user-abc-123', id: 'user-abc-123', role: 'CANDIDATE' },
          body: {
            filename: 'malicious.exe',
            mimeType: 'application/x-msdownload',
            category: 'resumes',
          },
        };
        const res = createMockRes();
        await storageController.requestPresignedUpload(req, res);

        assert.strictEqual(res.statusCode, 400);
        assert(res.body.message.includes('not allowed'));
      });
    });

    await describe('Suite 2: Local Driver Streaming Direct Upload & Magic Byte Verification', async () => {
      await it('Rejects upload when binary payload does not match declared PDF signature', async () => {
        totalTests++;
        const req = new Readable({
          read() {
            this.push(Buffer.from('NOT A REAL PDF HEADER'));
            this.push(null);
          },
        });
        req.params = { token: generatedUploadToken };

        const res = createMockRes();
        await storageController.handleLocalUpload(req, res);

        // Wait for stream end
        await new Promise((resolve) => setTimeout(resolve, 50));

        assert.strictEqual(res.statusCode, 400);
        assert(res.body.message.includes('File signature does not match'));
      });

      await it('Accepts upload with genuine %PDF magic bytes and writes file to storage', async () => {
        totalTests++;
        const validPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

        const req = new Readable({
          read() {
            this.push(validPdfBuffer);
            this.push(null);
          },
        });
        req.params = { token: generatedUploadToken };

        const res = createMockRes();
        await storageController.handleLocalUpload(req, res);

        await new Promise((resolve) => setTimeout(resolve, 50));

        assert.strictEqual(res.statusCode, 200);
        assert(res.body.success);
        assert.strictEqual(res.body.bytesWritten, validPdfBuffer.length);

        // Verify physical file was written on disk
        const exists = await storageService.fileExists(res.body.fileKey);
        assert(exists, 'File physically stored in storage root');

        // Cleanup
        await storageService.deleteFile(res.body.fileKey);
      });
    });

    await describe('Suite 3: Path Traversal Defense & Zero-Trust Access Control', async () => {
      await it('Blocks directory traversal attempts (../../etc/passwd)', async () => {
        totalTests++;
        assert.throws(
          () => {
            storageService.resolveLocalPath('../../windows/system32/cmd.exe');
          },
          /Access Denied: Attempted path traversal attack/
        );
      });

      await it('Blocks unauthorized non-owner from generating presigned download URL (403 Forbidden)', async () => {
        totalTests++;
        const req = {
          user: { _id: 'unauthorized-user-999', id: 'unauthorized-user-999', role: 'CANDIDATE' },
          body: {
            fileKey: 'resumes/other-user-123/private_resume.pdf',
          },
        };
        const res = createMockRes();
        await storageController.requestPresignedDownload(req, res);

        assert.strictEqual(res.statusCode, 403);
      });

      await it('Allows authorized recruiter to generate presigned download URL', async () => {
        totalTests++;
        const req = {
          user: { _id: 'recruiter-123', id: 'recruiter-123', role: 'RECRUITER' },
          body: {
            fileKey: 'resumes/candidate-456/cv.pdf',
          },
        };
        const res = createMockRes();
        await storageController.requestPresignedDownload(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert(res.body.downloadUrl.startsWith('/api/storage/local-download/'));
      });
    });

    console.log('\n========================================================================');
    console.log(`TOTAL PHASE 15 INTEGRATION TESTS: ${totalTests}`);
    console.log(`PASSED: ${totalTests}`);
    console.log(`FAILED: 0`);
    console.log('========================================================================\n');
  } finally {
  }
}

runPhase15Tests().catch((err) => {
  console.error('Fatal error running Phase 15 tests:', err);
  process.exit(1);
});
