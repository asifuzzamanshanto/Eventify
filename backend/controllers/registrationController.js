const Registration = require('../models/Registration');

/**
 * OLD shape (kept): returns only the Event documents the student registered for.
 * GET /api/registrations/my-events
 */
const getMyRegisteredEvents = async (req, res) => {
  try {
    const registrations = await Registration.find({ user: req.user._id })
      .populate({
        path: 'event',
        populate: { path: 'createdBy', select: 'username clubName' }
      });

    // filter out missing events, then sort by event.date ascending
    const events = registrations
      .filter(r => !!r.event)
      .map(r => r.event)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

/**
 * NEW shape: returns registrations with status + event (for student My Events page).
 * GET /api/registrations/mine?scope=past|upcoming
 *
 * Output:
 * [
 *   {
 *     id: <registrationId>,
 *     status: "registered" | "completed" | "banned",
 *     createdAt: <date>,
 *     event: { _id, id, title, date, location, imageUrl, createdBy?: { username, clubName } }
 *   }
 * ]
 */
const getMyRegistrations = async (req, res) => {
  try {
    const regs = await Registration.find({ user: req.user._id })
      .populate({
        path: 'event',
        select: 'title date location imageUrl createdBy',
        populate: { path: 'createdBy', select: 'username clubName' }
      });

    const now = new Date();
    const scope = (req.query.scope || '').toLowerCase();

    let out = regs
      .filter(r => !!r.event) // if an event got deleted
      .map(r => ({
        id: r._id,
        status: r.status || 'registered',
        createdAt: r.createdAt,
        event: {
          _id: r.event._id,
          id: r.event._id, // convenience for FE
          title: r.event.title,
          date: r.event.date,
          location: r.event.location,
          imageUrl: r.event.imageUrl,
          createdBy: r.event.createdBy || undefined, // { username, clubName }
        }
      }));

    // optional scope filter
    if (scope === 'past') {
      out = out.filter(x => new Date(x.event.date) < now);
    } else if (scope === 'upcoming') {
      out = out.filter(x => new Date(x.event.date) >= now);
    }

    // sort by event date ASC
    out.sort((a, b) => new Date(a.event.date) - new Date(b.event.date));

    res.json(out);
  } catch (e) {
    res.status(500).json({ message: 'Server Error: ' + e.message });
  }
};

module.exports = {
  getMyRegisteredEvents, // legacy
  getMyRegistrations    // new
};
