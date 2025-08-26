// backend/controllers/userController.js
const User = require('../models/User');
const { replaceBuffer } = require('../services/imagekit.service');
const sharp = require('sharp'); // 👈 for auto-square + resize

/**
 * Update own profile text fields (role-agnostic).
 * Route: PUT /api/users/me
 */
const updateMe = async (req, res) => {
  try {
    const userId = req.user._id;

    // Whitelist incoming fields
    const {
      fullName,
      username,
      university,
      bio,
      phoneNumber,
      address,
      // Student-only fields
      department,
      academicYear,
      studentId,
      // Organizer-only fields
      clubName,
      clubPosition,
      clubWebsite,
    } = req.body || {};

    const sanitize = (val) => (typeof val === 'string' ? val.trim() : undefined);

    const update = {};
    if (sanitize(fullName) !== undefined) update.fullName = sanitize(fullName);
    if (sanitize(username) !== undefined) update.username = sanitize(username);
    if (sanitize(university) !== undefined) update.university = sanitize(university);
    if (sanitize(bio) !== undefined) update.bio = sanitize(bio);
    if (sanitize(phoneNumber) !== undefined) update.phoneNumber = sanitize(phoneNumber);
    if (sanitize(address) !== undefined) update.address = sanitize(address);

    if (req.user.role === 'Student') {
      if (sanitize(department) !== undefined) update.department = sanitize(department);
      if (sanitize(academicYear) !== undefined) update.academicYear = sanitize(academicYear);
      if (sanitize(studentId) !== undefined) update.studentId = sanitize(studentId);
    }

    if (req.user.role === 'Organizer') {
      if (sanitize(clubName) !== undefined) update.clubName = sanitize(clubName);
      if (sanitize(clubPosition) !== undefined) update.clubPosition = sanitize(clubPosition);
      if (sanitize(clubWebsite) !== undefined) update.clubWebsite = sanitize(clubWebsite);
    }

    const updated = await User.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
      select: '-password',
    });

    if (!updated) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json(updated);
  } catch (err) {
    // Handle duplicate key errors (username/email uniqueness)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0];
      return res.status(409).json({ message: `${field} already exists. Please choose another.` });
    }

    return res.status(400).json({ message: 'Error updating profile: ' + err.message });
  }
};

/* ---------- Image helpers ---------- */
/** Square + resize + JPEG encode. Uses 'attention' so faces/logos stay centered. */
async function toSquareJpeg(buffer, sizePx) {
  return sharp(buffer)
    .rotate() // auto-orient by EXIF
    .resize(sizePx, sizePx, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

/**
 * Unified image upload controller.
 * - Avatar:    PATCH /api/users/me/avatar     (field: "avatar") -> squares to 512x512
 * - Club logo: PATCH /api/users/:id/club-logo (field: "logo")   -> squares to 1080x1080
 *
 * Routes set req.uploadTarget = 'avatar' | 'club-logo'
 */
const updateImageAsset = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const target = req.uploadTarget;

    if (target === 'avatar') {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Auto-square + resize to 512
      const processed = await toSquareJpeg(req.file.buffer, 512);
      const fileName = `user_${user._id}_avatar.jpg`;

      const { url, fileId } = await replaceBuffer(
        processed,
        fileName,
        '/avatars',
        user.avatarFileId || undefined
      );

      user.avatarUrl = url;
      user.avatarFileId = fileId;
      await user.save();

      return res.status(200).json({ avatarUrl: user.avatarUrl });
    }

    if (target === 'club-logo') {
      // Owner organizer or Super Admin
      if (req.user._id.toString() !== req.params.id && req.user.role !== 'Super Admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (user.role !== 'Organizer') {
        return res.status(400).json({ message: 'Club logo is only for Organizer accounts' });
      }

      // Auto-square + resize to 1080
      const processed = await toSquareJpeg(req.file.buffer, 1080);
      const fileName = `user_${user._id}_clublogo.jpg`;

      const { url, fileId } = await replaceBuffer(
        processed,
        fileName,
        '/club-logos',
        user.clubLogoFileId || undefined
      );

      user.clubLogoUrl = url;
      user.clubLogoFileId = fileId;
      await user.save();

      return res.status(200).json({ clubLogoUrl: user.clubLogoUrl });
    }

    return res.status(400).json({ message: 'Unknown upload target' });
  } catch (err) {
    return res.status(400).json({ message: 'Error uploading image: ' + err.message });
  }
};

/** Backward-compatible handler */
const updateClubLogo = async (req, res) => {
  req.uploadTarget = 'club-logo';
  return updateImageAsset(req, res);
};

module.exports = {
  updateMe,
  updateImageAsset,
  updateClubLogo,
};
