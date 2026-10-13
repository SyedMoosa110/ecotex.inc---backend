import fs from 'fs';
import path from 'path';
import config from '../config/index.js';
import logger from '../utils/logger.js';

export async function handleUpload(req, res) {
  try {
    const localUploads = config.paths.uploadsDir;
    const frontendDir1 = path.join(config.paths.root, '..', 'frontend', 'public', 'uploads');
    const frontendDir2 = path.join(config.paths.root, '..', 'ecotex-inc-frontend', 'public', 'uploads');
    const frontendPublicUploads = fs.existsSync(path.dirname(frontendDir1)) ? frontendDir1 : frontendDir2;

    // Ensure upload directories exist safely
    try {
      if (!fs.existsSync(localUploads)) {
        fs.mkdirSync(localUploads, { recursive: true });
      }
      if (fs.existsSync(path.dirname(frontendPublicUploads)) && !fs.existsSync(frontendPublicUploads)) {
        fs.mkdirSync(frontendPublicUploads, { recursive: true });
      }
    } catch (_) {}

    let buffer = null;
    let ext = '.png';
    let originalName = 'upload';

    // 1. Multipart file upload from multer
    if (req.file) {
      buffer = req.file.buffer;
      ext = path.extname(req.file.originalname) || '.png';
      originalName = path.basename(req.file.originalname, ext);
    }
    // 2. Base64 data from JSON body
    else if (req.body && req.body.data) {
      const { data, filename } = req.body;
      if (filename) {
        ext = path.extname(filename) || '.png';
        originalName = path.basename(filename, ext);
      }

      let base64Data = data;
      if (typeof data === 'string' && data.startsWith('data:')) {
        const parts = data.split(',');
        base64Data = parts[1];
        const match = data.match(/data:image\/([a-zA-Z0-9+]+);/);
        if (match) {
          ext = `.${match[1] === 'jpeg' ? 'jpg' : match[1]}`;
        }
      }

      buffer = Buffer.from(base64Data, 'base64');
    } else {
      return res.status(400).json({
        success: false,
        error: 'No file or image data provided for upload.',
      });
    }

    // Sanitize extension
    const cleanExt = ext.toLowerCase();
    const safeExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.pdf'];
    const finalExt = safeExtensions.includes(cleanExt) ? cleanExt : '.png';

    const safeName = originalName.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 30) || 'upload';
    const cleanFilename = `${safeName}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${finalExt}`;

    // Write to backend uploads
    const localFilePath = path.join(localUploads, cleanFilename);
    await fs.promises.writeFile(localFilePath, buffer);

    // Sync to frontend public uploads if exists
    if (fs.existsSync(path.dirname(frontendPublicUploads))) {
      try {
        await fs.promises.writeFile(path.join(frontendPublicUploads, cleanFilename), buffer);
      } catch (_) {}
    }

    const publicUrl = `/uploads/${cleanFilename}`;

    return res.json({
      success: true,
      url: publicUrl,
      filename: cleanFilename,
      fallbackData: req.body?.data || null,
    });
  } catch (err) {
    logger.error('File upload failed:', err);
    // Graceful fallback to raw data URL so UI doesn't break
    if (req.body?.data) {
      return res.json({
        success: true,
        url: req.body.data,
        filename: req.body.filename || 'uploaded-asset',
        fallbackData: req.body.data,
      });
    }
    return res.status(500).json({ success: false, error: 'File upload processing failed.' });
  }
}

export default {
  handleUpload,
};
