const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Keep your existing event fields, and add:
 * - status
 * - certificateTemplateUrl / certificateTemplateFileId
 * - certificateMapping (flexible object; FE decides the keys/shape)
 * - imageKitFileId already present for banner replacement
 */
const eventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },

    category: {
      type: String,
      required: true,
      enum: [
        'Workshop', 'Seminar', 'Guest Lecture', 'Networking Event', 'Hackathon', 'Competition', 'Career Fair',
        'Cultural Fest', 'Music Concert', 'Art Exhibition', 'Movie Night', 'Social Mixer', 'Food Festival',
        'Sports Tournament', 'Fitness Session', 'Outdoor Trip', 'Marathon', 'E-Sports Competition',
        'Charity Drive', 'Volunteer Day', 'Awareness Campaign', 'Club Meeting', 'Info Session'
      ]
    },

    // Banner
    imageUrl: { type: String, default: '' },        // used by FE
    imageKitFileId: { type: String, default: '' },  // used by ImageKit replace/delete

    capacity: { type: Number, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },

    // NEW: publication/status (used to lock editing on past/archived in FE)
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Archived'],
      default: 'Published'
    },

    // NEW: per-event certificate template + mapping (no generation on FE)
    certificateTemplateUrl: { type: String, default: '' },
    certificateTemplateFileId: { type: String, default: '' },

    /**
     * Flexible mapping object. The FE can send any structure, e.g.:
     * {
     *   name: { x, y, w, size, font, align, visible },
     *   institution: { ... },
     *   eventName: { ... },
     *   eventDate: { ... }
     * }
     */
    certificateMapping: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
