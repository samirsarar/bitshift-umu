const mongoose = require('mongoose');

const criticalLocationSchema = new mongoose.Schema(
  {
    clientUUID: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Location title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['sos', 'shelter', 'medical', 'food_water', 'hazard', 'responder_post'],
      required: true,
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    description: {
      type: String,
      default: '',
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
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
    status: {
      type: String,
      enum: ['active', 'resolved', 'verified'],
      default: 'active',
    },
    clientCreatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CriticalLocation', criticalLocationSchema);