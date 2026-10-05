const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an incident title'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    type: {
      type: String,
      required: [true, 'Please select a disaster/incident type'],
      enum: {
        values: [
          'flood',
          'fire',
          'earthquake',
          'accident',
          'landslide',
          'power',
          'medical',
          'infrastructure',
          'other',
        ],
        message: '{VALUE} is not a supported disaster type',
      },
      default: 'other',
    },
    severity: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: '{VALUE} is not a valid severity level',
      },
      default: 'medium',
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    coords: {
      type: [Number], // [lng, lat]
      default: [85.3096, 23.3441],
    },
    status: {
      type: String,
      enum: ['active', 'investigating', 'resolved', 'dismissed'],
      default: 'active',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reportedBy: {
      type: String,
      default: 'Community Member',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

// Index for geo/coordinates and creation time
reportSchema.index({ createdAt: -1 });
reportSchema.index({ type: 1, severity: 1, status: 1 });

module.exports = mongoose.model('Report', reportSchema);
