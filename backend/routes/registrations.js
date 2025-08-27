const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMyRegisteredEvents, // legacy
  getMyRegistrations     // new
} = require('../controllers/registrationController');

const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'Student') return next();
  return res.status(403).json({ message: 'Forbidden: This route is only for students.' });
};

/** Legacy: only events array */
router.get('/my-events', protect, isStudent, getMyRegisteredEvents);

/** New: registrations with status + event */
router.get('/mine', protect, isStudent, getMyRegistrations);

module.exports = router;
