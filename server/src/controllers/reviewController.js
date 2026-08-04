const Review = require('../models/Review');
const Module = require('../models/Module');
const { success, error } = require('../utils/apiResponse');

/**
 * Create a review for a module
 * POST /api/reviews
 */
async function createReview(req, res, next) {
  try {
    const { moduleId, status, comment } = req.body;

    const moduleExists = await Module.findById(moduleId);
    if (!moduleExists) {
      return error(res, 'Module not found', 404);
    }

    // Create the review record
    const review = await Review.create({
      module: moduleId,
      reviewer: req.user.id,
      status,
      comment,
    });

    // If the reviewer is an admin, transition the module's review status
    if (req.user.role === 'admin') {
      moduleExists.status = status;
      moduleExists.approvedBy = req.user.id;
      moduleExists.approvedAt = status === 'approved' ? Date.now() : undefined;
      await moduleExists.save();
    }

    return success(res, review, 201);
  } catch (err) {
    return next(err);
  }
}

/**
 * Retrieve all reviews with optional module filtering
 * GET /api/reviews
 */
async function getReviews(req, res, next) {
  try {
    const { moduleId, reviewStatus, type } = req.query;
    const filter = {};
    if (moduleId) {
      filter.module = moduleId;
    }
    if (reviewStatus) {
      filter.reviewStatus = reviewStatus;
    }
    if (type) {
      filter.type = type;
    }

    const reviews = await Review.find(filter)
      .populate('reviewer', 'name email')
      .populate('module', 'title description owner')
      .sort({ createdAt: -1 });

    return success(res, reviews);
  } catch (err) {
    return next(err);
  }
}

/**
 * Get a review by ID
 * GET /api/reviews/:id
 */
async function getReviewById(req, res, next) {
  try {
    const review = await Review.findById(req.params.id)
      .populate('reviewer', 'name email')
      .populate('module', 'title');

    if (!review) {
      return error(res, 'Review not found', 404);
    }
    return success(res, review);
  } catch (err) {
    return next(err);
  }
}

/**
 * Update an existing review
 * PATCH /api/reviews/:id
 */
async function updateReview(req, res, next) {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return error(res, 'Review not found', 404);
    }

    // Authorization: only the author (reviewer) or admin can modify a review
    const isReviewer = review.reviewer.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isReviewer && !isAdmin) {
      return error(res, 'Not authorized to update this review', 403);
    }

    const { status, comment } = req.body;
    if (status !== undefined) review.status = status;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    // If status was changed by an admin, keep the module's review status in sync
    if (status && isAdmin) {
      const moduleObj = await Module.findById(review.module);
      if (moduleObj) {
        moduleObj.status = status;
        moduleObj.approvedBy = req.user.id;
        moduleObj.approvedAt = status === 'approved' ? Date.now() : undefined;
        await moduleObj.save();
      }
    }

    return success(res, review);
  } catch (err) {
    return next(err);
  }
}

/**
 * Delete a review
 * DELETE /api/reviews/:id
 */
async function deleteReview(req, res, next) {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return error(res, 'Review not found', 404);
    }

    // Authorization: only the author or admin can delete a review
    const isReviewer = review.reviewer.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isReviewer && !isAdmin) {
      return error(res, 'Not authorized to delete this review', 403);
    }

    await Review.findByIdAndDelete(req.params.id);
    return success(res, { message: 'Review deleted successfully' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
};
