const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },

    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Make optional to support pending reviews where no reviewer is assigned yet
    },

    status: {
      type: String,
      enum: ['approved', 'rejected', 'pending'], // Allow 'pending' in original status
      required: false,
    },

    comment: {
      type: String,
    },

    // Upgraded Review workflow fields
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
    },
    moduleName: {
      type: String,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewComment: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['module', 'component'],
      default: 'module',
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Review', reviewSchema);
