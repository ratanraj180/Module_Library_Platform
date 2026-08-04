const Module = require('../models/Module');
const Review = require('../models/Review');
const Version = require('../models/Version');
const { success, error } = require('../utils/apiResponse');
const { getEmbedding, getLogicalChunks } = require('../utils/embeddingService');

// ─── GitHub API Fetching Helpers ──────────────────────────────────────────────
async function fetchGithubRepoMetadata(owner, repo) {
  // We use public raw APIs and standard GitHub API endpoints
  const headers = { 'User-Agent': 'ModuleLib-Platform' };
  
  // 1. Core Metadata
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) {
    throw new Error(`GitHub API returned status ${repoRes.status} for repository info`);
  }
  const repoData = await repoRes.json();

  // 2. package.json Detection (optional)
  let packageData = null;
  const pkgRes = await fetch(`https://raw.githubusercontent.com/http-raw/${owner}/${repo}/main/package.json`, { headers })
    .then(r => r.ok ? r.json() : fetch(`https://raw.githubusercontent.com/http-raw/${owner}/${repo}/master/package.json`, { headers }).then(r2 => r2.ok ? r2.json() : null))
    .catch(() => null);
  packageData = pkgRes;

  // 3. README.md content (optional)
  const readmeContent = await fetch(`https://raw.githubusercontent.com/http-raw/${owner}/${repo}/main/README.md`, { headers })
    .then(r => r.ok ? r.text() : fetch(`https://raw.githubusercontent.com/http-raw/${owner}/${repo}/master/README.md`, { headers }).then(r2 => r2.ok ? r2.text() : null))
    .catch(() => null);

  return { repoData, packageData, readmeContent };
}

function detectTechStack(repoData, packageData) {
  const deps = [];
  if (packageData) {
    if (packageData.dependencies) deps.push(...Object.keys(packageData.dependencies));
    if (packageData.devDependencies) deps.push(...Object.keys(packageData.devDependencies));
  }

  const detected = [];
  const lowercaseDeps = deps.map(d => d.toLowerCase());

  // Frontend Frameworks
  if (lowercaseDeps.includes('react')) detected.push('React');
  if (lowercaseDeps.includes('vue')) detected.push('Vue');
  if (lowercaseDeps.includes('angular') || lowercaseDeps.includes('@angular/core')) detected.push('Angular');
  if (lowercaseDeps.includes('next')) detected.push('Next.js');
  if (lowercaseDeps.includes('vite')) detected.push('Vite');

  // Backend Stack
  if (lowercaseDeps.includes('express')) detected.push('Express');
  if (lowercaseDeps.includes('mongodb') || lowercaseDeps.includes('mongoose')) detected.push('MongoDB');
  if (lowercaseDeps.includes('pg') || lowercaseDeps.includes('sequelize')) detected.push('PostgreSQL');
  if (lowercaseDeps.includes('redis') || lowercaseDeps.includes('ioredis')) detected.push('Redis');
  
  if (repoData.language) {
    detected.push(repoData.language);
  }

  // Deduplicate and fallback
  const uniqueTech = [...new Set(detected)];
  return uniqueTech.length > 0 ? uniqueTech.join(', ') : (repoData.language || 'JavaScript');
}

function extractDepsList(packageData) {
  if (!packageData) return [];
  const list = [];
  if (packageData.dependencies) list.push(...Object.keys(packageData.dependencies));
  if (packageData.devDependencies) list.push(...Object.keys(packageData.devDependencies));
  return [...new Set(list)];
}

function parseGithubUrl(url) {
  const cleanUrl = url.trim().replace(/\/$/, '');
  const match = cleanUrl.match(/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

/**
 * Create a new module
 * POST /api/modules
 */
async function createModule(req, res, next) {
  try {
    const {
      title,
      description,
      category,
      technology,
      categories,
      technologies,
      tags,
      repositoryUrl,
      currentVersion,
      importedFromGithub,
    } = req.body;

    let fileUrl;
    if (req.file) {
      fileUrl = req.file.path;
    } else if (req.body.artifactUrl) {
      fileUrl = req.body.artifactUrl;
    }

    let finalTitle = title;
    let finalDesc = description;
    let finalTech = technology;
    let finalTags = Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []);
    
    let isImported = false;
    let stars = 0;
    let lastUpdated = null;
    let depsList = [];
    let readme = '';

    if (importedFromGithub && repositoryUrl) {
      const parsed = parseGithubUrl(repositoryUrl);
      if (!parsed) {
        return error(res, 'Invalid GitHub repository URL format', 400);
      }
      try {
        const { repoData, packageData, readmeContent } = await fetchGithubRepoMetadata(parsed.owner, parsed.repo);
        isImported = true;
        stars = repoData.stargazers_count || 0;
        lastUpdated = repoData.updated_at ? new Date(repoData.updated_at) : null;
        depsList = extractDepsList(packageData);
        readme = readmeContent || '';

        // Auto-populate metadata if not filled
        finalTitle = title || `@org/${repoData.name.toLowerCase()}`;
        
        // Auto-generation description summary
        const primaryLang = repoData.language || 'software elements';
        const generatedSummary = `${repoData.name} is a system package built using ${primaryLang} hosting stars: ${stars}. Description: ${repoData.description || 'No summary provided.'}`;
        finalDesc = description || generatedSummary;
        
        finalTech = detectTechStack(repoData, packageData);

        if (repoData.topics && repoData.topics.length > 0) {
          finalTags = [...new Set([...finalTags, ...repoData.topics])];
        }
      } catch (err) {
        return error(res, `GitHub Import Failed: ${err.message}. Please use manual entry fallback.`, 400);
      }
    }

    // Support both array inputs and backward-compatible strings
    const finalCategories = Array.isArray(categories) && categories.length > 0 
      ? categories 
      : (category ? [category] : ['Other']);

    const finalTechnologies = Array.isArray(technologies) && technologies.length > 0 
      ? technologies 
      : (finalTech ? [finalTech] : ['JavaScript']);

    // Generate RAG embeddings
    const textToEmbed = `${finalTitle} ${finalDesc} ${(finalTags || []).join(" ")} ${(finalCategories || []).join(" ")} ${(finalTechnologies || []).join(" ")}`;
    const embedding = getEmbedding(textToEmbed);

    const docChunks = getLogicalChunks(readme);
    const chunks = docChunks.map((chk, idx) => ({
      chunkId: `${finalTitle}-chunk-${idx}`,
      chunkTitle: chk.title,
      chunkText: chk.text,
      embedding: getEmbedding(chk.text)
    }));

    const module = await Module.create({
      title: finalTitle,
      description: finalDesc,
      category: finalCategories[0],
      technology: finalTechnologies[0],
      categories: finalCategories,
      technologies: finalTechnologies,
      tags: finalTags,
      repositoryUrl,
      currentVersion: currentVersion || '1.0.0',
      fileUrl,
      owner: req.user.id,
      status: 'submitted',
      importedFromGithub: isImported,
      githubStars: stars,
      githubLastUpdated: lastUpdated,
      dependenciesList: depsList,
      readmeContent: readme,
      embedding,
      chunks
    });

    // Automatically create a Review document in the reviews collection
    await Review.create({
      module: module._id,
      reviewer: req.user.id, // Set default reviewer as owner to prevent Mongoose validation warnings on existing systems
      status: 'pending',
      comment: '',
      moduleId: module._id,
      moduleName: module.title,
      submittedBy: req.user.id,
      submittedAt: Date.now(),
      reviewStatus: 'pending',
      reviewComment: '',
      type: 'module'
    });

    // ── Link security report to the newly created module ──────────────────────
    // scanUpload middleware sets req.securityReportId when a file was uploaded
    // and scanned. We update the report here now that we have the real moduleId.
    // Fire-and-forget: do not await so we don't delay the HTTP response.
    if (req.securityReportId) {
      const SecurityReport = require('../models/SecurityReport');
      SecurityReport.findByIdAndUpdate(
        req.securityReportId,
        { moduleId: module._id },
      ).catch((linkErr) => {
        console.error(
          `[createModule] Failed to link SecurityReport ${req.securityReportId} ` +
          `to module ${module._id}: ${linkErr.message}`,
        );
      });
    }

    // Build response — attach scan summary if a file was scanned during upload.
    // This lets the frontend show the security badge without a separate API call.
    const responseData = module.toObject();
    if (req.malwareScanResult) {
      responseData.securityScan = {
        status:    'completed',
        reportId:  req.malwareScanResult.reportId,
        riskScore: req.malwareScanResult.riskScore,
        riskLevel: req.malwareScanResult.riskLevel,
        passed:    req.malwareScanResult.passed,
      };
    }

    // ── Auto-trigger full security pipeline (static analysis + all scanners) ─
    // The upload-time scan (req.securityReportId) only ran the malware scanner.
    // We now fire the FULL pipeline asynchronously so static analysis, dependency
    // scanning, and secret detection also run without blocking the HTTP response.
    //
    // For file uploads: creates a second SecurityReport alongside the upload-time one.
    // For GitHub imports: this is the only SecurityReport (clones the repo to scan).
    if ((req.file || module.repositoryUrl) && module._id) {
      const { startSecurityScan } = require('../services/security/securityPipeline');
      startSecurityScan({
        moduleId:    String(module._id),
        componentId: null,
        triggeredBy: req.user.id,
        isRescan:    false,
      }).catch((pipelineErr) => {
        console.error(
          `[createModule] Failed to auto-trigger security pipeline for ` +
          `module ${module._id}: ${pipelineErr.message}`,
        );
      });
      console.log(`[createModule] Full security pipeline triggered for module ${module._id}`);
    }

    return success(res, responseData, 201);

  } catch (err) {
    return next(err);
  }
}


/**
 * Retrieve list of modules with pagination, search, and category filtering
 * GET /api/modules
 */
async function getModules(req, res, next) {
  try {
    const { search, category, status } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);

    const filter = {};
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }
    if (status) {
      filter.status = status;
    }

    // Optional auth support: if guest, force 'approved' status
    if (!req.user) {
      filter.status = 'approved';
    }

    const [modules, total] = await Promise.all([
      Module.find(filter)
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Module.countDocuments(filter),
    ]);

    return success(res, {
      modules,
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
 * Get details of a single module by ID
 * GET /api/modules/:id
 */
async function getModuleById(req, res, next) {
  try {
    const module = await Module.findById(req.params.id).populate('owner', 'name email');
    if (!module) {
      return error(res, 'Module not found', 404);
    }

    // Optional auth support: if guest, make sure it is approved
    if (!req.user && module.status !== 'approved') {
      return error(res, 'Not authorized to view this component', 403);
    }

    return success(res, module);
  } catch (err) {
    return next(err);
  }
}

/**
 * Update an existing module
 * PATCH /api/modules/:id
 */
async function updateModule(req, res, next) {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return error(res, 'Module not found', 404);
    }

    const isOwner = module.owner.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return error(res, 'Not authorized to update this module', 403);
    }

    const updatable = [
      'title',
      'description',
      'category',
      'technology',
      'tags',
      'repositoryUrl',
      'currentVersion',
    ];
    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        module[field] = req.body[field];
      }
    });

    // Re-generate RAG embeddings and chunks on update
    const textToEmbed = `${module.title} ${module.description} ${(module.tags || []).join(" ")} ${module.category} ${module.technology}`;
    module.embedding = getEmbedding(textToEmbed);

    const docChunks = getLogicalChunks(module.readmeContent || "");
    module.chunks = docChunks.map((chk, idx) => ({
      chunkId: `${module.title}-chunk-${idx}`,
      chunkTitle: chk.title,
      chunkText: chk.text,
      embedding: getEmbedding(chk.text)
    }));

    await module.save();

    return success(res, module);
  } catch (err) {
    return next(err);
  }
}

/**
 * Delete a module and all associated versions and reviews
 * DELETE /api/modules/:id
 */
async function deleteModule(req, res, next) {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return error(res, 'Module not found', 404);
    }

    const isOwner = module.owner.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return error(res, 'Not authorized to delete this module', 403);
    }

    await Module.findByIdAndDelete(req.params.id);

    // Cascade delete versions and reviews associated with this module
    await Promise.all([
      Review.deleteMany({ module: req.params.id }),
      Version.deleteMany({ module: req.params.id }),
    ]);

    return success(res, { message: 'Module and associated records deleted successfully' });
  } catch (err) {
    return next(err);
  }
}

/**
 * Submit module for admin review
 * PATCH /api/modules/:id/submit
 */
async function submitForReview(req, res, next) {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return error(res, 'Module not found', 404);
    }

    if (module.owner.toString() !== req.user.id) {
      return error(res, 'Only the module owner can submit for review', 403);
    }

    if (module.status !== 'pending') {
      return error(res, `Module cannot be submitted from status "${module.status}"`, 400);
    }

    module.status = 'submitted';
    await module.save();

    // Ensure a pending Review document exists in the reviews collection
    const reviewExists = await Review.findOne({ module: module._id, reviewStatus: 'pending' });
    if (!reviewExists) {
      await Review.create({
        module: module._id,
        reviewer: req.user.id,
        status: 'pending',
        comment: '',
        moduleId: module._id,
        moduleName: module.title,
        submittedBy: req.user.id,
        submittedAt: Date.now(),
        reviewStatus: 'pending',
        reviewComment: '',
        type: 'module'
      });
    }

    return success(res, module);
  } catch (err) {
    return next(err);
  }
}

/**
 * Approve a submitted module
 * PATCH /api/modules/:id/approve
 */
async function approveModule(req, res, next) {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return error(res, 'Module not found', 404);
    }

    // ── Check Security Report before Approve ────────────────────────────────
    const SecurityReport = require('../models/SecurityReport');
    const report = await SecurityReport.findOne({ moduleId: module._id }).sort({ createdAt: -1 });

    if (report) {
      // 1. If malware found, disable approval completely
      if (report.malwareResult && report.malwareResult.detected) {
        console.warn(`[AuditLog] [Blocked Approval] Attempt to approve infected module "${module.title}" (${module._id}) blocked.`);
        return error(res, 'Approval blocked: malware was detected in this module. Approving infected modules is strictly prohibited.', 403);
      }

      // 2. If risk score is below configurable threshold, require manual override
      const threshold = Number(process.env.SECURITY_OVERRIDE_THRESHOLD) || 80;
      if (report.scanStatus === 'completed' && report.riskScore < threshold) {
        if (req.body.overrideThreshold !== true) {
          return error(res, `Approval rejected: Security score (${report.riskScore}) is below the required safety threshold of ${threshold}. A manual override is required to approve this module.`, 403);
        }
        console.log(`[AuditLog] [Manual Override] Admin "${req.user.email || req.user.id}" utilized manual threshold override to approve module "${module.title}" (${module._id}) with score ${report.riskScore}.`);
      }    }

    module.status = 'approved';
    module.approvedBy = req.user.id;
    module.approvedAt = Date.now();
    await module.save();

    // Log approval audit record
    console.log(`[AuditLog] [Approval] Module "${module.title}" (${module._id}) APPROVED by admin "${req.user.email || req.user.id}". Score: ${report ? report.riskScore : 'N/A'}.`);

    // Search and update pending review if exists, otherwise fallback to creating new review
    const pendingReview = await Review.findOne({ module: module._id, reviewStatus: 'pending' });
    if (pendingReview) {
      pendingReview.reviewer = req.user.id;
      pendingReview.status = 'approved';
      pendingReview.comment = req.body.comment || 'Approved';
      pendingReview.reviewStatus = 'approved';
      pendingReview.reviewComment = req.body.comment || 'Approved';
      await pendingReview.save();
    } else {
      await Review.create({
        module: module._id,
        reviewer: req.user.id,
        status: 'approved',
        comment: req.body.comment || 'Approved',
        moduleId: module._id,
        moduleName: module.title,
        submittedBy: module.owner,
        submittedAt: Date.now(),
        reviewStatus: 'approved',
        reviewComment: req.body.comment || 'Approved',
        type: 'module'
      });
    }

    return success(res, module);
  } catch (err) {
    return next(err);
  }
}

/**
 * Reject a submitted module
 * PATCH /api/modules/:id/reject
 */
async function rejectModule(req, res, next) {
  try {
    const { comment } = req.body;
    if (!comment) {
      return error(res, 'A comment is required to reject a module', 400);
    }

    const module = await Module.findById(req.params.id);
    if (!module) {
      return error(res, 'Module not found', 404);
    }

    module.status = 'rejected';
    await module.save();

    // Log rejection audit record
    console.log(`[AuditLog] [Rejection] Module "${module.title}" (${module._id}) REJECTED by admin "${req.user.email || req.user.id}". Reason: "${comment}".`);

    // Search and update pending review if exists, otherwise fallback to creating new review
    const pendingReview = await Review.findOne({ module: module._id, reviewStatus: 'pending' });
    if (pendingReview) {
      pendingReview.reviewer = req.user.id;
      pendingReview.status = 'rejected';
      pendingReview.comment = comment;
      pendingReview.reviewStatus = 'rejected';
      pendingReview.reviewComment = comment;
      await pendingReview.save();
    } else {
      await Review.create({
        module: module._id,
        reviewer: req.user.id,
        status: 'rejected',
        comment: comment,
        moduleId: module._id,
        moduleName: module.title,
        submittedBy: module.owner,
        submittedAt: Date.now(),
        reviewStatus: 'rejected',
        reviewComment: comment,
        type: 'module'
      });
    }

    return success(res, module);
  } catch (err) {
    return next(err);
  }
}

/**
 * Track and get download URL for approved modules
 * GET /api/modules/:id/download
 */
async function downloadModule(req, res, next) {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return error(res, 'Module not found', 404);
    }

    if (module.status !== 'approved') {
      return error(res, 'Module is not available for download', 403);
    }

    module.downloadCount += 1;
    await module.save();

    const downloadUrl = module.fileUrl || null;

    return success(res, { downloadUrl, module });
  } catch (err) {
    return next(err);
  }
}

/**
 * Retrieve queue of modules pending review (admin only)
 * GET /api/modules/queue
 */
async function getApprovalQueue(req, res, next) {
  try {
    const modules = await Module.find({ status: 'submitted' })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    return success(res, modules);
  } catch (err) {
    return next(err);
  }
}

/**
 * Sync GitHub metadata
 * POST /api/modules/:id/sync
 */
async function syncModuleGithub(req, res, next) {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return error(res, 'Module not found', 404);
    }
    if (!module.repositoryUrl) {
      return error(res, 'This module does not have a repository URL configured', 400);
    }

    const parsed = parseGithubUrl(module.repositoryUrl);
    if (!parsed) {
      return error(res, 'Invalid repository URL format for GitHub sync', 400);
    }

    const { repoData, packageData, readmeContent } = await fetchGithubRepoMetadata(parsed.owner, parsed.repo);
    
    module.githubStars = repoData.stargazers_count || 0;
    module.githubLastUpdated = repoData.updated_at ? new Date(repoData.updated_at) : null;
    module.dependenciesList = extractDepsList(packageData);
    module.readmeContent = readmeContent || '';
    
    // Refresh stack detection
    module.technology = detectTechStack(repoData, packageData);

    if (repoData.topics && repoData.topics.length > 0) {
      module.tags = [...new Set([...module.tags, ...repoData.topics])];
    }

    await module.save();
    return success(res, module);
  } catch (err) {
    return error(res, `GitHub Sync Failed: ${err.message}`, 400);
  }
}

module.exports = {
  createModule,
  getModules,
  getModuleById,
  updateModule,
  deleteModule,
  submitForReview,
  approveModule,
  rejectModule,
  downloadModule,
  getApprovalQueue,
  syncModuleGithub,
};
