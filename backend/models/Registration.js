const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * We add a "status" field so organizers can:
 * - ban participants
 * - mark completed (so students can download certificates)
 *
 * Unique index on (user, event) prevents duplicates.
 */
const registrationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    // NEW
    status: {
      type: String,
      enum: ['registered', 'completed', 'banned'],
      default: 'registered'
    }
  },
  { timestamps: true }
);

// Prevent duplicate registrations by the same user for the same event
registrationSchema.index({ user: 1, event: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);
module.exports = Registration;
