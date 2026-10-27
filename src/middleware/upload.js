// Multer upload middleware. Validates file type, size, and stores under random names.

import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import { env } from '../config/env.js';
import { ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES } from '../constants/limits.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Random name to prevent path traversal and collisions
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = crypto.randomUUID() + ext;
    cb(null, randomName);
  },
});

/**
 * Filter that rejects files with disallowed MIME types or extensions.
 */
const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error('Only PDF, JPG, and PNG files are allowed'), false);
  }
  cb(null, true);
};

/**
 * Configured multer instance.
 * Use upload.array('files', MAX_FILES) or upload.single('file') in routes.
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: env.MAX_FILES_PER_REQUEST,
  },
});
