const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.resolve(__dirname, '../public/uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage engine with filename sanitization
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Sanitize original filename and strip path characters
        const cleanName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${file.fieldname || 'upload'}-${Date.now()}-${cleanName}`);
    }
});

// Strict allowlist — explicitly NO SVG to prevent Stored XSS
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx']);
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

// Check file type and extension
function checkFileType(file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const isExtAllowed = ALLOWED_EXTENSIONS.has(ext);
    const isMimeAllowed = ALLOWED_MIME_TYPES.has(file.mimetype);

    // Reject SVG explicitly
    if (file.mimetype === 'image/svg+xml' || ext === '.svg') {
        return cb(new Error('SVG files are not permitted for security reasons.'));
    }

    if (isExtAllowed && isMimeAllowed) {
        return cb(null, true);
    } else {
        return cb(new Error('Only valid images (JPG, PNG, WEBP) and documents (PDF, DOC, DOCX) are allowed!'));
    }
}

// Init upload with 10MB limit
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

const avatarFilter = checkFileType;

// Magic byte verification middleware
const validateUploadedFile = async (req, res, next) => {
    if (!req.file) return next();
    try {
        const filePath = path.resolve(req.file.path);
        const resolvedUploadDir = path.resolve(uploadDir);
        if (!filePath.startsWith(resolvedUploadDir + path.sep) && filePath !== resolvedUploadDir) {
            await fs.promises.unlink(filePath).catch(() => {});
            return res.status(400).json({ message: 'Invalid file upload path' });
        }

        const buffer = Buffer.alloc(8);
        const fd = await fs.promises.open(filePath, 'r');
        await fd.read(buffer, 0, 8, 0);
        await fd.close();

        const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
        const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // %PDF
        const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
        const isJpg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
        const isZipDocx = buffer[0] === 0x50 && buffer[1] === 0x4B; // PK (docx)
        const isDoc = buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0;
        const isRiffWebp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46; // RIFF

        let validMagic = false;
        if (ext === 'pdf' && isPdf) validMagic = true;
        else if ((ext === 'jpg' || ext === 'jpeg') && isJpg) validMagic = true;
        else if (ext === 'png' && isPng) validMagic = true;
        else if (ext === 'webp' && isRiffWebp) validMagic = true;
        else if (ext === 'docx' && isZipDocx) validMagic = true;
        else if (ext === 'doc' && (isDoc || isZipDocx)) validMagic = true;

        if (!validMagic) {
            await fs.promises.unlink(filePath).catch(() => {});
            return res.status(400).json({ message: 'Invalid file signature (magic bytes mismatch)' });
        }
        next();
    } catch (err) {
        next();
    }
};

module.exports = upload;
module.exports.upload = upload;
module.exports.avatarFilter = avatarFilter;
module.exports.validateUploadedFile = validateUploadedFile;
module.exports.uploadDir = uploadDir;

