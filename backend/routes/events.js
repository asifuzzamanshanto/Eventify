const express = require('express');
const router = express.Router();

const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  getEventAttendees,
  updateEventBanner,
  uploadCertificateTemplate,
  updateCertificateMapping,
  batchUpdateParticipants,
} = require('../controllers/eventController');

const { protect } = require('../middleware/authMiddleware');
const { makeUploader } = require('../middleware/upload');
const { validateAspectRatio } = require('../middleware/validateImage');

/* ----------------------------- RBAC ------------------------------ */
const canManageEvents = (req, res, next) => {
  if (req.user && (req.user.role === 'Organizer' || req.user.role === 'Super Admin')) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Access is restricted to Organizers or Super Admins.' });
};

const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'Student') return next();
  return res.status(403).json({ message: 'Forbidden: Access is restricted to Students.' });
};

/* ----------------------------- Events ---------------------------- */
router.get('/', getAllEvents);
router.get('/:id', getEventById);

router.post('/', protect, canManageEvents, createEvent);
router.put('/:id', protect, canManageEvents, updateEvent);
router.delete('/:id', protect, canManageEvents, deleteEvent);

/* --------------------------- Registration ------------------------ */
router.get('/:id/attendees', protect, getEventAttendees);
router.get('/:id/participants', protect, getEventAttendees);

router.post('/:id/register', protect, isStudent, registerForEvent);
router.delete('/:id/unregister', protect, isStudent, unregisterFromEvent);

/* ---------------------------- Banners ---------------------------- */
// 10 MB max; accept any dimensions as long as ~16:9 ratio
const uploadBanner = makeUploader(10 * 1024 * 1024);

const bannerHandlers = [
  protect,
  canManageEvents,
  uploadBanner.single('banner'),
  validateAspectRatio(16, 9), // allow any size but must be ≈16:9
  updateEventBanner,
];

// Primary PATCH route
router.patch('/:id/banner', ...bannerHandlers);

// Optional POST alias (kept for compatibility; you can remove if not needed)
router.post('/:id/banner', ...bannerHandlers);

/* -------------------------- Certificates ------------------------- */
const uploadCert = makeUploader(10 * 1024 * 1024);

router.post(
  '/:id/certificate-template',
  protect,
  canManageEvents,
  uploadCert.single('template'),
  uploadCertificateTemplate
);

router.patch(
  '/:id/certificate-mapping',
  protect,
  canManageEvents,
  updateCertificateMapping
);

/* ----------------------- Participants (batch) -------------------- */
router.post(
  '/:id/participants/batch',
  protect,
  canManageEvents,
  batchUpdateParticipants
);

module.exports = router;
