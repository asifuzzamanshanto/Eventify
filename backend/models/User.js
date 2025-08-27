// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // Auth / identity
    username:    { type: String, trim: true },
    fullName:    { type: String, trim: true },
    email:       { type: String, trim: true, lowercase: true },
    phoneNumber: { type: String, trim: true },

    // Roles & moderation
    role:   { type: String, enum: ['User', 'Organizer', 'Super Admin'], default: 'User' },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Approved' },

    // Club profile fields (used by Clubs page)
    clubName:     { type: String, trim: true },
    clubWebsite:  { type: String, trim: true },
    clubLogoUrl:  { type: String, trim: true },
    clubLogoFileId: { type: String, trim: true }, // optional (for your uploader)

    // Additional info
    bio:        { type: String, trim: true }, // <-- "User details" shown on Club page
    university: { type: String, trim: true },
    city:       { type: String, trim: true },
    address:    { type: String, trim: true },
    avatar:     { type: String, trim: true }, // if you keep a user avatar

    // security fields (only if you have them; harmless if unused)
    passwordHash: { type: String, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
