import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Media } from '../../models/index.js';
import User from '../../models/User.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import config from '../../config/environment.js';

// Use memory storage — we process images with sharp before writing to disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Unsupported file type'), false);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.MAX_FILE_SIZE },
});

// Compress and save an image buffer to disk, returns { filename, filepath, url, size }
async function processAndSaveImage(buffer, userId, mimetype, mediaType) {
  const dir = path.join(config.UPLOAD_DIR, 'users', userId.toString());
  fs.mkdirSync(dir, { recursive: true });

  const filename = `${uuidv4()}.webp`;
  const filepath = path.join(dir, filename);
  const url      = `/uploads/users/${userId}/${filename}`;

  // Size caps per media type
  const sizeMap = { avatar: 400, banner: 1200, cover: 900, image: 1400 };
  const maxWidth = sizeMap[mediaType] || 1200;

  await sharp(buffer)
    .rotate()                          // auto-orient from EXIF
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(filepath);

  const { size } = fs.statSync(filepath);
  return { filename, filepath, url, size };
}

// POST /api/media/upload
export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) return errorResponse(res, 400, 'No file provided.');

    const mediaType = req.body.mediaType || (req.file.mimetype.startsWith('image/') ? 'image' : 'document');
    let filename, filepath, url, size, mimetype;

    if (req.file.mimetype.startsWith('image/') && req.file.mimetype !== 'image/gif') {
      // Compress + convert to webp
      ({ filename, filepath, url, size } = await processAndSaveImage(
        req.file.buffer, req.user._id, req.file.mimetype, mediaType
      ));
      mimetype = 'image/webp';
    } else {
      // Non-image or GIF: write directly
      const dir = path.join(config.UPLOAD_DIR, 'users', req.user._id.toString());
      fs.mkdirSync(dir, { recursive: true });
      const ext = path.extname(req.file.originalname);
      filename  = `${uuidv4()}${ext}`;
      filepath  = path.join(dir, filename);
      url       = `/uploads/users/${req.user._id}/${filename}`;
      size      = req.file.size;
      mimetype  = req.file.mimetype;
      fs.writeFileSync(filepath, req.file.buffer);
    }

    const media = await Media.create({
      owner: req.user._id,
      filename,
      originalName: req.file.originalname,
      mimetype,
      size,
      path: filepath,
      url,
      altText:  req.body.altText  || '',
      caption:  req.body.caption  || '',
      mediaType,
    });

    if (mediaType === 'avatar') await User.findByIdAndUpdate(req.user._id, { avatar: url });
    if (mediaType === 'banner') await User.findByIdAndUpdate(req.user._id, { banner: url });

    return successResponse(res, 201, 'File uploaded.', { media });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// GET /api/media
export const getMyMedia = async (req, res) => {
  try {
    const { mediaType, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const filter = { owner: req.user._id };
    if (mediaType) filter.mediaType = mediaType;

    const media = await Media.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    return successResponse(res, 200, 'Media retrieved.', { media });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// DELETE /api/media/:id
export const deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return errorResponse(res, 404, 'Media not found.');
    if (media.owner.toString() !== req.user._id.toString()) return errorResponse(res, 403, 'Not authorized.');

    fs.unlink(media.path, (err) => {
      if (err) console.error('File delete error:', err);
    });
    await media.deleteOne();
    return successResponse(res, 200, 'Media deleted.');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};
