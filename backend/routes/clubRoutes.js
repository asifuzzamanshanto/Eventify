const express = require('express');
const router = express.Router();
const { getAllClubs, getClubById } = require('../controllers/clubController');

// Public routes
router.get('/', getAllClubs);
router.get('/:id', getClubById);

module.exports = router;
