const mongoose = require('mongoose');

const evacuationRouteSchema = new mongoose.Schema(
  {
    clientUUID: {
      type: String,
      required: true,
      unique: true, // Prevents duplicate entries on repeated syncs
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Route title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['clear', 'caution', 'blocked'],
      default: 'clear',
    },
    // Array of coordinate points forming the route path: [[lat, lng], [lat, lng], ...]
    path: {
      type: [[Number]],
      required: true,
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length >= 2;
        },
        message: 'A route path must contain at least 2 coordinate pairs [lat, lng]',
      },
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reporterName: {
      type: String,
      default: 'Anonymous Responder',
    },
    clientCreatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EvacuationRoute', evacuationRouteSchema);