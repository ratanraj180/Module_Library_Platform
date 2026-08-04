/**
 * @file securityController.js
 * @description Controller for the Security Scanning Pipeline.
 * Supports both Modules and Components cleanly.
 */

const { success, error } = require('../utils/apiResponse');
const Module = require('../models/Module');
const Component = require('../models/Component');
const SecurityReport = require('../models/SecurityReport');
const { scanResource } = require('../services/security/securityPipeline');

/**
 * Initiates a new security scan for a module or component.
 */
async function startScan(req, res) {
  try {
    const resourceType = req.params.componentId ? 'component' : 'module';
    const resourceId = req.params.componentId || req.params.moduleId;

    // ── Verify resource exists ──────────────────────────────────────────────
    let resourceDoc = null;
    if (resourceType === 'module') {
      resourceDoc = await Module.findById(resourceId);
    } else {
      resourceDoc = await Component.findById(resourceId);
    }

    if (!resourceDoc) {
      return error(res, `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found`, 404);
    }

    // ── Authorization: owner or admin ────────────────────────────────────────
    const isOwner = String(resourceDoc.owner) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return error(res, `You do not have permission to scan this ${resourceType}`, 403);
    }

    // ── Guard: prevent duplicate active scans ─────────────────────────────────
    const query = resourceType === 'module' 
      ? { moduleId: resourceId } 
      : { componentId: resourceId };
    
    const activeReport = await SecurityReport.findOne({
      ...query,
      scanStatus: { $in: ['pending', 'running'] },
    });

    if (activeReport) {
      return error(
        res,
        `A scan is already ${activeReport.scanStatus} for this ${resourceType} (report: ${activeReport._id})`,
        409
      );
    }

    // ── Kick off the pipeline (non-blocking) ──────────────────────────────────
    const { reportId } = await scanResource(resourceType, resourceId, {
      triggeredBy: req.user.id,
      isRescan: false,
    });

    const responsePayload = {
      message: 'Security scan initiated successfully. Poll the report endpoint for results.',
      reportId,
      scanStatus: 'pending'
    };
    if (resourceType === 'module') {
      responsePayload.moduleId = resourceId;
    } else {
      responsePayload.componentId = resourceId;
    }

    return success(res, responsePayload, 202);
  } catch (err) {
    console.error('[securityController.startScan]', err);
    return error(res, 'Failed to initiate security scan', 500);
  }
}

/**
 * Retrieves the most recent security report for a module or component.
 */
async function getReport(req, res) {
  try {
    const resourceType = req.params.componentId ? 'component' : 'module';
    const resourceId = req.params.componentId || req.params.moduleId;

    // ── Verify resource exists ──────────────────────────────────────────────
    let resourceDoc = null;
    if (resourceType === 'module') {
      resourceDoc = await Module.findById(resourceId).select('_id title owner');
    } else {
      resourceDoc = await Component.findById(resourceId).select('_id title owner');
    }

    if (!resourceDoc) {
      return error(res, `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found`, 404);
    }

    // ── Fetch scan report ───────────────────────────────────────────────────
    const query = resourceType === 'module' 
      ? { moduleId: resourceId } 
      : { componentId: resourceId };

    const report = await SecurityReport.findOne(query)
      .sort({ createdAt: -1 })
      .populate('triggeredBy', 'name email')
      .lean();

    if (!report) {
      return error(
        res,
        `No security report found for this ${resourceType}. Initiate a scan first.`,
        404
      );
    }

    const responsePayload = { report };
    if (resourceType === 'module') {
      responsePayload.module = { id: resourceDoc._id, title: resourceDoc.title };
    } else {
      responsePayload.component = { id: resourceDoc._id, title: resourceDoc.title };
    }

    return success(res, responsePayload);
  } catch (err) {
    console.error('[securityController.getReport]', err);
    return error(res, 'Failed to retrieve security report', 500);
  }
}

/**
 * Triggers a manual re-scan of a resource.
 */
async function rescan(req, res) {
  try {
    const resourceType = req.params.componentId ? 'component' : 'module';
    const resourceId = req.params.componentId || req.params.moduleId;

    // ── Verify resource exists ──────────────────────────────────────────────
    let resourceDoc = null;
    if (resourceType === 'module') {
      resourceDoc = await Module.findById(resourceId);
    } else {
      resourceDoc = await Component.findById(resourceId);
    }

    if (!resourceDoc) {
      return error(res, `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found`, 404);
    }

    // ── Authorization: owner or admin ────────────────────────────────────────
    const isOwner = String(resourceDoc.owner) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return error(res, `You do not have permission to rescan this ${resourceType}`, 403);
    }

    // ── Guard: prevent duplicate active scans ─────────────────────────────────
    const query = resourceType === 'module' 
      ? { moduleId: resourceId } 
      : { componentId: resourceId };

    const activeReport = await SecurityReport.findOne({
      ...query,
      scanStatus: { $in: ['pending', 'running'] },
    });

    if (activeReport) {
      return error(
        res,
        `A scan is already ${activeReport.scanStatus} for this ${resourceType}. Wait for it to complete before rescanning.`,
        409
      );
    }

    // ── Kick off a new pipeline run (marked as rescan) ────────────────────────
    const { reportId } = await scanResource(resourceType, resourceId, {
      triggeredBy: req.user.id,
      isRescan: true,
    });

    const responsePayload = {
      message: 'Re-scan initiated successfully. Poll the report endpoint for results.',
      reportId,
      scanStatus: 'pending',
      isRescan: true,
    };
    if (resourceType === 'module') {
      responsePayload.moduleId = resourceId;
    } else {
      responsePayload.componentId = resourceId;
    }

    return success(res, responsePayload, 202);
  } catch (err) {
    console.error('[securityController.rescan]', err);
    return error(res, 'Failed to initiate re-scan', 500);
  }
}

/**
 * Returns the scan history for a module or component.
 */
async function getHistory(req, res) {
  try {
    const resourceType = req.params.componentId ? 'component' : 'module';
    const resourceId = req.params.componentId || req.params.moduleId;

    // ── Verify resource exists ──────────────────────────────────────────────
    let resourceDoc = null;
    if (resourceType === 'module') {
      resourceDoc = await Module.findById(resourceId).select('_id title');
    } else {
      resourceDoc = await Component.findById(resourceId).select('_id title');
    }

    if (!resourceDoc) {
      return error(res, `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found`, 404);
    }

    // ── Parse pagination params ─────────────────────────────────────────────
    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip  = (page - 1) * limit;

    const query = resourceType === 'module' 
      ? { moduleId: resourceId } 
      : { componentId: resourceId };

    const [reports, total] = await Promise.all([
      SecurityReport.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('_id scanStatus riskScore riskLevel isRescan triggeredBy startedAt completedAt createdAt pipelineError')
        .populate('triggeredBy', 'name email')
        .lean(),
      SecurityReport.countDocuments(query),
    ]);

    const responsePayload = {
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      history: reports,
    };
    if (resourceType === 'module') {
      responsePayload.module = { id: resourceDoc._id, title: resourceDoc.title };
    } else {
      responsePayload.component = { id: resourceDoc._id, title: resourceDoc.title };
    }

    return success(res, responsePayload);
  } catch (err) {
    console.error('[securityController.getHistory]', err);
    return error(res, 'Failed to retrieve scan history', 500);
  }
}

module.exports = {
  startScan,
  getReport,
  rescan,
  getHistory,
};
