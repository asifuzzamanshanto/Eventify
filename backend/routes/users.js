// backend/routes/users.js
const express = require('express');
const router = express.Router();

const { getOrganizerClubs } = require('../controllers/userController');

// Public: organizer users as "club profiles"
// GET /api/users/organizer-clubs?q=&page=&limit=
router.get('/organizer-clubs', getOrganizerClubs);

module.exports = router;
