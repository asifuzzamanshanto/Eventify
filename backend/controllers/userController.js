// backend/controllers/userController.js
const User = require('../models/User');

/**
 * GET /api/users/organizer-clubs?q=&page=&limit=
 * Public: return Organizer users as "club profiles" for the Clubs page.
 *
 * Fields used:
 *  - clubName, clubLogoUrl, clubWebsite, city, bio
 *  - Optional extras for display/search: university, email, phoneNumber, fullName, username
 */
async function getOrganizerClubs(req, res) {
  try {
    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '12', 10), 1), 100);
    const q     = (req.query.q || '').trim();

    const textFilter = q
      ? {
          $or: [
            { clubName:   new RegExp(q, 'i') },
            { university: new RegExp(q, 'i') },
            { city:       new RegExp(q, 'i') },
            { fullName:   new RegExp(q, 'i') },
            { username:   new RegExp(q, 'i') },
          ],
        }
      : {};

    // Add status: 'Approved' if you gate visibility
    const baseFilter = { role: 'Organizer' /*, status: 'Approved'*/ };
    const filter = { ...baseFilter, ...textFilter };

    const total = await User.countDocuments(filter);

    const users = await User.find(filter, {
      clubName:     1,
      clubLogoUrl:  1,
      clubWebsite:  1,
      city:         1,
      bio:          1,
      university:   1,
      email:        1,
      phoneNumber:  1,
      fullName:     1,
      username:     1,
      createdAt:    1,
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Normalize shape for the frontend cards
    const data = users.map((u) => ({
      title:       u.clubName || u.fullName || u.username || 'Organizer',
      logo:        u.clubLogoUrl || '',
      url:         u.clubWebsite || '',
      city:        u.city || '',
      university:  u.university || '',
      email:       u.email || '',
      phone:       u.phoneNumber || '',
      description: u.bio || '',
      events:      [], // none for now
    }));

    return res.json({
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('getOrganizerClubs error:', err);
    return res.status(500).json({ message: 'Failed to load organizer clubs' });
  }
}

module.exports = {
  getOrganizerClubs,
};
