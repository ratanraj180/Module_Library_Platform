const Component = require('../models/Component');
const { success, error } = require('../utils/apiResponse');
const { getEmbedding, getLogicalChunks } = require('../utils/embeddingService');

/**
 * Create a new component
 * POST /api/components
 */
async function createComponent(req, res, next) {
  try {
    console.log("DEBUG: Current User Request:", req.user);
    const {
      title,
      description,
      category,
      tags,
      frontendCode,
      backendCode,
      currentVersion,
      documentation,
      dependencies,
      installation,
    } = req.body;

    const textToEmbed = `${title} ${description} ${(tags || []).join(" ")} ${category}`;
    const embedding = getEmbedding(textToEmbed);

    const docChunks = getLogicalChunks(documentation || "");
    const chunks = docChunks.map((chk, idx) => ({
      chunkId: `${title}-chunk-${idx}`,
      chunkTitle: chk.title,
      chunkText: chk.text,
      embedding: getEmbedding(chk.text)
    }));

    const component = await Component.create({
      title,
      description,
      category,
      tags,
      frontendCode,
      backendCode,
      currentVersion,
      documentation,
      dependencies,
      installation,
      owner: req.user.id,
      status: 'pending',
      embedding,
      chunks
    });

    // Start background security scanning pipeline
    const { scanResource } = require('../services/security/securityPipeline');
    let reportId = null;
    try {
      const scanResult = await scanResource('component', String(component._id), {
        triggeredBy: req.user.id,
        isRescan: false,
      });
      reportId = scanResult.reportId;
    } catch (scanErr) {
      console.error('[componentController] Failed to trigger auto scan:', scanErr);
    }

    return success(res, {
      ...component.toObject(),
      securityScan: reportId ? {
        reportId,
        scanStatus: 'pending',
      } : null
    }, 201);
  } catch (err) {
    console.log("DEBUG: Create Component Error:", err);
    return next(err);
  }
}

/**
 * Retrieve list of components
 * GET /api/components
 */
async function getComponents(req, res, next) {
  try {
    const { search, category, status, owner } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);

    const filter = {};
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }

    // Role-based visibility and status constraints
    const userRole = req.user?.role?.toLowerCase();
    const userId = req.user?.id || req.user?._id;

    if (!req.user || !userId) {
      // Guest: only approved components, ignore owner queries
      filter.status = 'approved';
    } else if (userRole === 'admin') {
      // Admin can query any status or owner
      if (status) {
        filter.status = status;
      }
      if (owner && owner !== 'undefined') {
        filter.owner = owner;
      }
    } else {
      // Developer or general signed-in user
      if (status) {
        filter.status = status;
      }
      
      // Show developer's own components OR public approved components
      filter.$or = [
        { status: 'approved' },
        { owner: userId }
      ];

      // If they explicitly filter by owner (which must match their ID if developer)
      if (owner && owner !== 'undefined') {
        filter.owner = owner;
      }
    }

    const [components, total] = await Promise.all([
      Component.find(filter)
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Component.countDocuments(filter),
    ]);

    return success(res, {
      modules: components, // Align key name with existing paginated list wrapper used by frontend
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Get details of a single component by ID
 * GET /api/components/:id
 */
async function getComponentById(req, res, next) {
  try {
    const component = await Component.findById(req.params.id).populate('owner', 'name email');
    if (!component) {
      return error(res, 'Component not found', 404);
    }

    // Optional auth support: if guest, make sure it is approved
    if (!req.user && component.status !== 'approved') {
      return error(res, 'Not authorized to view this component', 403);
    }

    return success(res, component);
  } catch (err) {
    return next(err);
  }
}

/**
 * Update component details
 * PATCH /api/components/:id
 */
async function updateComponent(req, res, next) {
  try {
    const component = await Component.findById(req.params.id);
    if (!component) {
      return error(res, 'Component not found', 404);
    }

    const isOwner = component.owner.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return error(res, 'Not authorized to update this component', 403);
    }

    const updatable = [
      'title',
      'description',
      'category',
      'tags',
      'frontendCode',
      'backendCode',
      'currentVersion',
      'documentation',
      'dependencies',
      'installation',
    ];
    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        component[field] = req.body[field];
      }
    });

    // Re-generate RAG embeddings and chunks on update
    const textToEmbed = `${component.title} ${component.description} ${(component.tags || []).join(" ")} ${component.category}`;
    component.embedding = getEmbedding(textToEmbed);

    const docChunks = getLogicalChunks(component.documentation || "");
    component.chunks = docChunks.map((chk, idx) => ({
      chunkId: `${component.title}-chunk-${idx}`,
      chunkTitle: chk.title,
      chunkText: chk.text,
      embedding: getEmbedding(chk.text)
    }));

    await component.save();
    return success(res, component);
  } catch (err) {
    return next(err);
  }
}

/**
 * Delete a component
 * DELETE /api/components/:id
 */
async function deleteComponent(req, res, next) {
  try {
    const component = await Component.findById(req.params.id);
    if (!component) {
      return error(res, 'Component not found', 404);
    }

    const isOwner = component.owner.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return error(res, 'Not authorized to delete this component', 403);
    }

    await Component.findByIdAndDelete(req.params.id);
    return success(res, { message: 'Component deleted successfully' });
  } catch (err) {
    return next(err);
  }
}

/**
 * Submit component for review
 * PATCH /api/components/:id/submit
 */
async function submitForReview(req, res, next) {
  try {
    const component = await Component.findById(req.params.id);
    if (!component) {
      return error(res, 'Component not found', 404);
    }

    if (component.owner.toString() !== req.user.id) {
      return error(res, 'Only the component owner can submit for review', 403);
    }

    if (component.status !== 'pending') {
      return error(res, `Component cannot be submitted from status "${component.status}"`, 400);
    }

    component.status = 'submitted';
    await component.save();
    return success(res, component);
  } catch (err) {
    return next(err);
  }
}

/**
 * Approve a submitted component
 * PATCH /api/components/:id/approve
 */
async function approveComponent(req, res, next) {
  try {
    const component = await Component.findById(req.params.id);
    if (!component) {
      return error(res, 'Component not found', 404);
    }

    // ── Check Security Report before Approve ────────────────────────────────
    const SecurityReport = require('../models/SecurityReport');
    const report = await SecurityReport.findOne({ componentId: component._id }).sort({ createdAt: -1 });

    if (report) {
      // 1. If malware found, disable approval completely
      if (report.malwareResult && report.malwareResult.detected) {
        console.warn(`[AuditLog] [Blocked Approval] Attempt to approve infected component "${component.title}" (${component._id}) blocked.`);
        return error(res, 'Approval blocked: malware was detected in this component. Approving infected components is strictly prohibited.', 403);
      }

      // 2. If risk score is below configurable threshold, require manual override
      const threshold = Number(process.env.SECURITY_OVERRIDE_THRESHOLD) || 80;
      if (report.scanStatus === 'completed' && report.riskScore < threshold) {
        if (req.body.overrideThreshold !== true) {
          return error(res, `Approval rejected: Security score (${report.riskScore}) is below the required safety threshold of ${threshold}. A manual override is required to approve this component.`, 403);
        }
        console.log(`[AuditLog] [Manual Override] Admin "${req.user.email || req.user.id}" utilized manual threshold override to approve component "${component.title}" (${component._id}) with score ${report.riskScore}.`);
      }
    }

    component.status = 'approved';
    component.approvedBy = req.user.id;
    component.approvedAt = Date.now();
    component.rejectComment = '';
    await component.save();

    // Log approval audit record
    console.log(`[AuditLog] [Approval] Component "${component.title}" (${component._id}) APPROVED by admin "${req.user.email || req.user.id}". Score: ${report ? report.riskScore : 'N/A'}.`);

    return success(res, component);
  } catch (err) {
    return next(err);
  }
}

/**
 * Reject a submitted component
 * PATCH /api/components/:id/reject
 */
async function rejectComponent(req, res, next) {
  try {
    const { comment } = req.body;
    if (!comment) {
      return error(res, 'A feedback comment is required to reject a component', 400);
    }

    const component = await Component.findById(req.params.id);
    if (!component) {
      return error(res, 'Component not found', 404);
    }

    component.status = 'rejected';
    component.rejectComment = comment;
    await component.save();

    // Log rejection audit record
    console.log(`[AuditLog] [Rejection] Component "${component.title}" (${component._id}) REJECTED by admin "${req.user.email || req.user.id}". Reason: "${comment}".`);

    return success(res, component);
  } catch (err) {
    return next(err);
  }
}

/**
 * Track download stats for a component
 * GET /api/components/:id/download
 */
async function downloadComponent(req, res, next) {
  try {
    const component = await Component.findById(req.params.id);
    if (!component) {
      return error(res, 'Component not found', 404);
    }

    component.downloadCount += 1;
    await component.save();

    return success(res, component);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createComponent,
  getComponents,
  getComponentById,
  updateComponent,
  deleteComponent,
  submitForReview,
  approveComponent,
  rejectComponent,
  downloadComponent,
};
