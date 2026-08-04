const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');

/**
 * Get the profile of the currently logged-in user
 * GET /api/users/me
 */
async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return error(res, 'User not found', 404);
    }
    return success(res, user);
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin creates a new user directly
 * POST /api/users
 */
async function createUser(req, res, next) {
  try {
    const { name, email, password, role = 'developer', isActive = true } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return error(res, 'Email already in use', 400);
    }

    // Password hashing occurs in User model pre-save hook
    const user = await User.create({ name, email, password, role, isActive });

    const userObj = user.toObject();
    delete userObj.password;

    return success(res, userObj, 201);
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin retrieves all users
 * GET /api/users
 */
async function getAllUsers(req, res, next) {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return success(res, users);
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin retrieves detailed user profile by ID
 * GET /api/users/:id
 */
async function getUserById(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return error(res, 'User not found', 404);
    }
    return success(res, user);
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin updates details for a specific user
 * PUT /api/users/:id
 */
async function updateUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return error(res, 'User not found', 404);
    }

    const updatableFields = ['name', 'email', 'password', 'role', 'isActive'];
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    return success(res, userObj);
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin deletes a user
 * DELETE /api/users/:id
 */
async function deleteUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return error(res, 'User not found', 404);
    }

    await User.findByIdAndDelete(req.params.id);
    return success(res, { message: 'User deleted successfully' });
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin updates the role of a user
 * PATCH /api/users/:id/role
 */
async function updateRole(req, res, next) {
  try {
    const { role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return error(res, 'User not found', 404);
    }

    user.role = role;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    return success(res, userObj);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getProfile,
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateRole,
};
