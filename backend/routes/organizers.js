const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Event = require('../models/Event');

/**
 * GET /api/organizers/events
 * Returns all events created by the logged-in organizer
 * Shape for FE cards: { id, title, date, location, imageUrl, status }
 */
router.get('/events', protect, async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user._id })
      .sort({ date: 1 })
      .select('title date location imageUrl status createdBy');

    const out = events.map(e => ({
      id: e._id.toString(),
      title: e.title,
      date: e.date,
      location: e.location,
      imageUrl: e.imageUrl,
      status: e.status,
    }));

    res.json(out);
  } catch (e) {
    res.status(500).json({ message: 'Server Error: ' + e.message });
  }
});

module.exports = router;
