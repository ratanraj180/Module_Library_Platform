const Module = require('../models/Module');
const Version = require('../models/Version');
const { success, error } = require('../utils/apiResponse');

/**
 * Add a new version to a module
 * POST /api/modules/:moduleId/versions
 */
async function addVersion(req, res, next) {
  try {
    const module = await Module.findById(req.params.moduleId);
    if (!module) {
      return error(res, 'Module not found', 404);
    }

    // Only the module owner or admin can add a version
    const isOwner = module.owner.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return error(res, 'Not authorized to add a version to this module', 403);
    }

    const { versionNumber, changelog, fileUrl, repositoryUrl } = req.body;

    const version = await Version.create({
      module: module._id,
      versionNumber,
      changelog,
      fileUrl,
      repositoryUrl,
      uploadedBy: req.user.id,
    });

    // Update the current version reference in the module model
    module.currentVersion = versionNumber;
    await module.save();

    return success(res, version, 201);
  } catch (err) {
    return next(err);
  }
}

/**
 * Retrieve all versions for a module
 * GET /api/modules/:moduleId/versions
 */
async function getVersions(req, res, next) {
  try {
    const module = await Module.findById(req.params.moduleId);
    if (!module) {
      return error(res, 'Module not found', 404);
    }

    const versions = await Version.find({ module: req.params.moduleId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    return success(res, versions);
  } catch (err) {
    return next(err);
  }
}

/**
 * Get details of a single version by ID
 * GET /api/modules/:moduleId/versions/:versionId
 */
async function getVersionById(req, res, next) {
  try {
    const { moduleId, versionId } = req.params;

    const module = await Module.findById(moduleId);
    if (!module) {
      return error(res, 'Module not found', 404);
    }

    const version = await Version.findOne({
      _id: versionId,
      module: moduleId,
    }).populate('uploadedBy', 'name email');

    if (!version) {
      return error(res, 'Version not found', 404);
    }

    return success(res, version);
  } catch (err) {
    return next(err);
  }
}

/**
 * Update an existing version
 * PUT /api/modules/:moduleId/versions/:versionId
 */
async function updateVersion(req, res, next) {
  try {
    const { moduleId, versionId } = req.params;

    const module = await Module.findById(moduleId);
    if (!module) {
      return error(res, 'Module not found', 404);
    }

    const version = await Version.findById(versionId);
    if (!version || version.module.toString() !== moduleId) {
      return error(res, 'Version not found for this module', 404);
    }

    // Authorization check: Only uploader, module owner, or admin can update
    const isUploader = version.uploadedBy.toString() === req.user.id;
    const isModuleOwner = module.owner.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isUploader && !isModuleOwner && !isAdmin) {
      return error(res, 'Not authorized to update this version', 403);
    }

    const updatable = ['versionNumber', 'changelog', 'fileUrl', 'repositoryUrl'];
    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        version[field] = req.body[field];
      }
    });

    await version.save();

    // If version number was modified and is the module's current version, sync it
    if (req.body.versionNumber && module.currentVersion === req.body.versionNumber) {
      module.currentVersion = req.body.versionNumber;
      await module.save();
    }

    return success(res, version);
  } catch (err) {
    return next(err);
  }
}

/**
 * Delete a version
 * DELETE /api/modules/:moduleId/versions/:versionId
 */
async function deleteVersion(req, res, next) {
  try {
    const { moduleId, versionId } = req.params;

    const module = await Module.findById(moduleId);
    if (!module) {
      return error(res, 'Module not found', 404);
    }

    const version = await Version.findById(versionId);
    if (!version || version.module.toString() !== moduleId) {
      return error(res, 'Version not found for this module', 404);
    }

    // Authorization check: Only uploader, module owner, or admin can delete
    const isUploader = version.uploadedBy.toString() === req.user.id;
    const isModuleOwner = module.owner.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isUploader && !isModuleOwner && !isAdmin) {
      return error(res, 'Not authorized to delete this version', 403);
    }

    await Version.findByIdAndDelete(versionId);

    // If we deleted the current version of the module, find the next latest version to sync
    if (module.currentVersion === version.versionNumber) {
      const latestVersion = await Version.findOne({ module: moduleId }).sort({ createdAt: -1 });
      module.currentVersion = latestVersion ? latestVersion.versionNumber : '1.0.0';
      await module.save();
    }

    return success(res, { message: 'Version deleted successfully' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  addVersion,
  getVersions,
  getVersionById,
  updateVersion,
  deleteVersion,
};
