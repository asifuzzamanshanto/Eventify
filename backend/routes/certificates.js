const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { downloadCertificate } = require('../controllers/certificateController');

router.get('/:eventId/download', protect, downloadCertificate);

module.exports = router;
