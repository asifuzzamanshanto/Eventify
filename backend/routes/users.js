// backend/routes/users.js
const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { updateMe, updateImageAsset } = require('../controllers/userController');
const { makeUploader } = require('../middleware/upload');

// Single 5 MB uploader for all profile images
const upload5MB = makeUploader(5 * 1024 * 1024);

// Helper to tag upload target for the unified controller
const setUploadTarget = (target) => (req, _res, next) => {
  req.uploadTarget = target; // 'avatar' | 'club-logo'
  next();
};

// Text profile updates
router.put('/me', protect, updateMe);

// Avatar upload (client can crop; server will auto-square/resize)
router.patch(
  '/me/avatar',
  protect,
  setUploadTarget('avatar'),
  upload5MB.single('avatar'),
  updateImageAsset
);

// Organizer club logo upload (client can crop; server will auto-square/resize)
router.patch(
  '/:id/club-logo',
  protect,
  setUploadTarget('club-logo'),
  upload5MB.single('logo'),
  updateImageAsset
);

module.exports = router;
