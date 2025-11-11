/**
 * Multer Middleware for File Uploads
 */
import multer from 'multer';
import { Request } from 'express';

// Configure multer for memory storage (files will be in memory as buffers)
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Single file upload middleware
export const uploadSingle = upload.single('image');
