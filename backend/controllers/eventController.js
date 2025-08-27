const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { replaceBuffer } = require('../services/imagekit.service');

/* ------------------------------ Create ------------------------------ */
const createEvent = async (req, res) => {
  const { title, description, date, location, category, imageUrl, capacity, status } = req.body;
  try {
    const event = new Event({
      title,
      description,
      date,
      location,
      category,
      imageUrl,
      capacity,
      status: status || 'Published',
      createdBy: req.user._id,
    });
    const createdEvent = await event.save();
    res.status(201).json(createdEvent);
  } catch (error) {
    res.status(400).json({ message: 'Error creating event: ' + error.message });
  }
};

/* ------------------------------- Read ------------------------------- */
const getAllEvents = async (req, res) => {
  try {
    // Public list: future events only
    const events = await Event.find({ date: { $gte: new Date() } })
      .sort({ date: 1 })
      .populate('createdBy', 'username clubName');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'username clubName');
    if (event) return res.json(event);
    return res.status(404).json({ message: 'Event not found' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

/* ------------------------------ Update ------------------------------ */
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Super Admin') {
      return res.status(403).json({ message: 'User not authorized to update this event' });
    }

    // Only allow safe fields
    const fields = ['title', 'description', 'date', 'location', 'category', 'capacity', 'status'];
    fields.forEach(f => {
      if (typeof req.body[f] !== 'undefined') event[f] = req.body[f];
    });

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: 'Error updating event: ' + error.message });
  }
};

/* ------------------------------ Delete ------------------------------ */
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Super Admin') {
      return res.status(403).json({ message: 'User not authorized to delete this event' });
    }

    await Registration.deleteMany({ event: req.params.id });
    await event.deleteOne();
    res.json({ message: 'Event and all associated registrations have been removed.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

/* --------------------------- Registration --------------------------- */
const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const registrationCount = await Registration.countDocuments({
      event: event._id,
      status: { $ne: 'banned' }
    });

    if (event.capacity != null && registrationCount >= event.capacity) {
      return res.status(400).json({ message: 'This event is currently full.' });
    }

    const already = await Registration.findOne({ event: event._id, user: req.user._id });
    if (already) {
      return res.status(400).json({ message: 'You are already registered for this event.' });
    }

    await Registration.create({ user: req.user._id, event: event._id, status: 'registered' });
    res.status(201).json({ message: 'Registered successfully for the event.' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You are already registered for this event.' });
    }
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

const unregisterFromEvent = async (req, res) => {
  try {
    const result = await Registration.deleteOne({ event: req.params.id, user: req.user._id });
    if (result.deletedCount > 0) return res.json({ message: 'Unregistered successfully.' });
    return res.status(404).json({ message: 'You were not registered for this event.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

/* ----------------------------- Attendees ---------------------------- */
const getEventAttendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Organizer or Super Admin can view
    const isOwner = req.user && event.createdBy.toString() === req.user._id.toString();
    const isSuper = req.user && req.user.role === 'Super Admin';
    if (!isOwner && !isSuper) {
      return res.status(403).json({ message: 'Not authorized to view attendees for this event.' });
    }

    // Populate user and return registration status
    const regs = await Registration.find({ event: req.params.id })
      .populate('user', 'name username email university avatar');

    const attendees = regs.map(r => ({
      id: r.user?._id?.toString(),
      name: r.user?.name,
      username: r.user?.username,
      email: r.user?.email,
      university: r.user?.university,
      avatar: r.user?.avatar,
      status: r.status || 'registered',
    }));

    res.json(attendees);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

/* ------------------------------ Banners ----------------------------- */
// upload/replace event banner (1920x1080 enforced in route)
const updateEventBanner = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Super Admin') {
      return res.status(403).json({ message: 'User not authorized to update this event' });
    }

    const ext = (req.file.originalname?.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `event_${event._id}_banner.${ext}`;

    const { url, fileId } = await replaceBuffer(
      req.file.buffer,
      fileName,
      '/banners',
      event.imageKitFileId
    );

    event.imageUrl = url;        // used by FE
    event.imageKitFileId = fileId;
    const saved = await event.save();

    res.status(200).json({ _id: saved._id, imageUrl: saved.imageUrl });
  } catch (error) {
    res.status(400).json({ message: 'Error uploading banner: ' + error.message });
  }
};

/* --------------------------- Certificates --------------------------- */
// Upload/replace certificate template image
const uploadCertificateTemplate = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Super Admin') {
      return res.status(403).json({ message: 'User not authorized' });
    }

    const ext = (req.file.originalname?.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `event_${event._id}_cert_template.${ext}`;

    const { url, fileId } = await replaceBuffer(
      req.file.buffer,
      fileName,
      '/cert-templates',
      event.certificateTemplateFileId
    );

    event.certificateTemplateUrl = url;
    event.certificateTemplateFileId = fileId;
    await event.save();

    res.json({ url });
  } catch (e) {
    res.status(400).json({ message: 'Error uploading template: ' + e.message });
  }
};

// Save field mapping
const updateCertificateMapping = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Super Admin') {
      return res.status(403).json({ message: 'User not authorized' });
    }

    const { mapping } = req.body;
    event.certificateMapping = mapping || {};
    await event.save();

    res.json({ mapping: event.certificateMapping });
  } catch (e) {
    res.status(400).json({ message: 'Error saving mapping: ' + e.message });
  }
};

/* ----------------------- Participants (batch) ---------------------- */
const batchUpdateParticipants = async (req, res) => {
  try {
    const { action, userIds } = req.body;
    if (!['ban', 'complete'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds required' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Super Admin') {
      return res.status(403).json({ message: 'User not authorized' });
    }

    const status = action === 'ban' ? 'banned' : 'completed';
    const result = await Registration.updateMany(
      { event: event._id, user: { $in: userIds } },
      { $set: { status } }
    );

    const matched = result.matchedCount ?? result.n ?? 0;
    const modified = result.modifiedCount ?? result.nModified ?? 0;

    res.json({ matched, modified });
  } catch (e) {
    res.status(400).json({ message: 'Error updating participants: ' + e.message });
  }
};

module.exports = {
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
};
