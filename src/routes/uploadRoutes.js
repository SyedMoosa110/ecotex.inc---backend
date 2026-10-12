import express from 'express';
import multer from 'multer';
import config from '../config/index.js';
import { handleUpload } from '../controllers/uploadController.js';

const storage = multer.memoryStorage();
const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: config.upload.maxSizeBytes,
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${config.upload.allowedMimeTypes.join(', ')}`));
    }
  },
}).single('file');

export const uploadRouter = express.Router();

uploadRouter.post('/', (req, res, next) => {
  // Check if content-type is multipart
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message });
      }
      handleUpload(req, res, next);
    });
  } else {
    // JSON base64 upload
    handleUpload(req, res, next);
  }
});

export default uploadRouter;
