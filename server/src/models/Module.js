const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
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
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    technology: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    categories: [
      {
        type: String,
      }
    ],

    technologies: [
      {
        type: String,
      }
    ],

    tags: [
      {
        type: String,
      },
    ],

    repositoryUrl: {
      type: String,
      required: true,
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

    currentVersion: {
      type: String,
      default: '1.0.0',
    },

    fileUrl: {
      type: String,
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

    // GitHub Import Metadata
    importedFromGithub: {
      type: Boolean,
      default: false,
    },
    githubStars: {
      type: Number,
      default: 0,
    },
    githubLastUpdated: {
      type: Date,
    },
    dependenciesList: [
      {
        type: String,
      },
    ],
    readmeContent: {
      type: String,
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
moduleSchema.index({ title: 'text', tags: 'text', category: 'text', technology: 'text', keywords: 'text' });

module.exports = mongoose.model('Module', moduleSchema);
