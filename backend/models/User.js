// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },

    phoneNumber: { type: String },
    address: { type: String },
    university: {
      type: String,
      required: function () {
        return this.role === 'Student' || this.role === 'Organizer';
      },
    },

    role: { type: String, enum: ['Student', 'Organizer', 'Super Admin'], required: true },

    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Approved',
    },

    // Profile extras
    bio: { type: String, default: '' },               // 👈 NEW
    avatarUrl: { type: String, default: '' },         // 👈 NEW
    avatarFileId: { type: String, default: '' },      // 👈 NEW

    // Student-only
    department: {
      type: String,
      required: function () {
        return this.role === 'Student';
      },
    },
    academicYear: {
      type: String,
      required: function () {
        return this.role === 'Student';
      },
    },
    studentId: {
      type: String,
      required: function () {
        return this.role === 'Student';
      },
    },

    // Organizer-only
    clubName: {
      type: String,
      required: function () {
        return this.role === 'Organizer';
      },
    },
    clubPosition: {
      type: String,
      required: function () {
        return this.role === 'Organizer';
      },
    },
    clubWebsite: { type: String },

    // Club branding (optional)
    clubLogoUrl: { type: String, default: '' },
    clubLogoFileId: { type: String, default: '' },

    // Moderation/audit
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

// Speed up queries like: find organizers with "Pending" status
userSchema.index({ role: 1, status: 1 });

// Hash password on save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hide sensitive/internal fields when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.avatarFileId;   // 👈 hide storage file IDs
  delete obj.clubLogoFileId; // 👈 hide storage file IDs
  return obj;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
