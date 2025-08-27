const multer = require('multer');

function makeUploader(maxSizeBytes) {
  const storage = multer.memoryStorage();
  return multer({
    storage,
    limits: { fileSize: maxSizeBytes },
    fileFilter: (req, file, cb) => {
      // allow common image mimetypes; adjust if you need PDFs, etc.
      if (/^image\/(png|jpe?g|webp|gif|bmp)$/i.test(file.mimetype)) return cb(null, true);
      cb(new Error('Unsupported file type'));
    },
  });
}

module.exports = { makeUploader };
