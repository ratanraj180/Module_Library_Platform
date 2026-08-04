const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ['UI Components', 'Backend Components'],
      required: true,
    },

    tags: [
      {
        type: String,
      },
    ],

    frontendCode: {
      type: String,
      default: '',
    },

    backendCode: {
      type: String,
      default: '',
    },

    currentVersion: {
      type: String,
      default: '1.0.0',
    },

    documentation: {
      type: String,
      default: '',
    },

    dependencies: {
      type: String,
      default: '',
    },

    installation: {
      type: String,
      default: '',
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'submitted', 'approved', 'rejected'],
      default: 'pending',
    },

    downloadCount: {
      type: Number,
      default: 0,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    approvedAt: {
      type: Date,
    },

    rejectComment: {
      type: String,
      default: '',
    },
    embedding: {
      type: [Number],
      default: [],
    },
    chunks: [
      {
        chunkId: String,
        chunkTitle: String,
        chunkText: String,
        embedding: [Number],
      }
    ],
  },
  {
    timestamps: true,
  }
);

// Add text indexes on searchable fields to optimize MongoDB query performance
componentSchema.index({ title: 'text', tags: 'text', category: 'text', technology: 'text', keywords: 'text' });

module.exports = mongoose.model('Component', componentSchema);
