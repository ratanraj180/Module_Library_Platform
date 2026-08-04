const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema(
  {
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },

    versionNumber: {
      type: String,
      required: true,
    },

    changelog: {
      type: String,
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    fileUrl: {
      type: String,
    },

    repositoryUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Version', versionSchema);
