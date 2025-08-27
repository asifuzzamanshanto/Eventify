const sharp = require('sharp');

/** Reject unless the uploaded image matches EXACT width & height */
function validateExactImage(requiredW, requiredH) {
  return async (req, res, next) => {
    try {
      if (!req.file?.buffer) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      const meta = await sharp(req.file.buffer).metadata();
      if (meta.width !== requiredW || meta.height !== requiredH) {
        return res.status(400).json({
          message: `Invalid image dimensions. Required ${requiredW}x${requiredH}, got ${meta.width}x${meta.height}.`
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Accept any dimensions as long as width/height ≈ target ratio (default ±2%) */
function validateAspectRatio(targetW, targetH, tolerance = 0.02) {
  const target = targetW / targetH;
  return async (req, res, next) => {
    try {
      if (!req.file?.buffer) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      const meta = await sharp(req.file.buffer).metadata();
      if (!meta.width || !meta.height) {
        return res.status(400).json({ message: 'Invalid image file' });
      }
      const ratio = meta.width / meta.height;
      const ok = Math.abs(ratio - target) <= target * tolerance;
      if (!ok) {
        return res.status(400).json({
          message: 'Please upload a 16:9 image (e.g., 1280×720, 1600×900, 1920×1080).'
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { validateExactImage, validateAspectRatio };
