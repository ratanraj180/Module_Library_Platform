const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { success, error } = require('../utils/apiResponse');

/**
 * Register a new user
 * POST /api/auth/signup
 */
async function signup(req, res, next) {
  try {
    const { name, email, password, role = 'developer' } = req.body;

    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return error(res, 'Email already in use', 400);
    }

    // Create new user (password is automatically hashed via schema pre-save hook)
    const user = await User.create({ name, email, password, role });

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Prepare response object, removing password field
    const userObj = user.toObject();
    delete userObj.password;

    return success(res, { token, user: userObj }, 201);
  } catch (err) {
    return next(err);
  }
}

/**
 * Log in an existing user
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
     const { email, password } = req.body;

     console.log('[LOGIN] Attempt for email:', email);
     console.log('[LOGIN] Password received (length):', password ? password.length : 0);

     // Check if user exists
     const user = await User.findOne({ email });
     if (!user) {
       console.log('[LOGIN] FAIL: No user found in MongoDB for email:', email);
       return error(res, 'Invalid credentials', 401);
     }

     console.log('[LOGIN] User found in MongoDB:', user._id, '| role:', user.role);

     // Validate the password locally
     let isMatch = await user.comparePassword(password);
     console.log('[LOGIN] bcrypt.compare result:', isMatch);

     // Fallback to Firebase Sign-in check to support synchronization of reset password
     if (!isMatch && process.env.FIREBASE_API_KEY) {
       console.log('[LOGIN] bcrypt failed. Trying Firebase fallback...');
       try {
         const firebaseRes = await fetch(
           `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
           {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ email, password, returnSecureToken: true }),
           }
         );
         const firebaseBody = await firebaseRes.json().catch(() => ({}));
         console.log('[LOGIN] Firebase fallback HTTP status:', firebaseRes.status);
         console.log('[LOGIN] Firebase fallback response body:', JSON.stringify(firebaseBody));
         if (firebaseRes.ok) {
           console.log('[LOGIN] Firebase fallback succeeded. Syncing password to MongoDB...');
           // Password reset was completed on Firebase. Sync password locally to MongoDB.
           user.password = password;
           await user.save();
           isMatch = true;
         } else {
           console.log('[LOGIN] Firebase fallback FAILED with status:', firebaseRes.status);
         }
       } catch (err) {
         console.error('[LOGIN] Firebase validation fallback error:', err);
       }
     }

     if (!isMatch) {
       console.log('[LOGIN] FAIL: Password did not match for user:', email);
       return error(res, 'Invalid credentials', 401);
     }

     // Generate JWT token
     const token = generateToken(user._id, user.role);
     console.log('[LOGIN] SUCCESS: JWT issued for user:', user._id);

     // Prepare response object, removing password field
     const userObj = user.toObject();
     delete userObj.password;

     return success(res, { token, user: userObj }, 200);
  } catch (err) {
     console.error('[LOGIN] Unexpected error:', err);
     return next(err);
  }
}
/**
 * Get the currently authenticated user's profile
 * GET /api/auth/profile
 */
async function getProfile(req, res, next) {
  try {
    // req.user is populated by the auth middleware with { id, role }
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return error(res, 'User not found', 404);
    }

    return success(res, user, 200);
  } catch (err) {
    return next(err);
  }
}

/**
 * Google Sign-In (Login / Registration)
 * POST /api/auth/google
 */
async function googleLogin(req, res, next) {
  try {
    const { name, email, uid, profilePicture } = req.body;

    if (!email) {
      return error(res, 'Email is required for Google Sign-In', 400);
    }

    // 1. Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // 2. If user does not exist, register them
      // We generate a secure random password since password field is required in the DB
      const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: randomPassword,
        role: 'developer',
        firebaseUid: uid || null,
        avatar: profilePicture || null,
      });
    } else {
      // Update Firebase UID or Avatar if not set
      let updated = false;
      if (uid && !user.firebaseUid) {
        user.firebaseUid = uid;
        updated = true;
      }
      if (profilePicture && !user.avatar) {
        user.avatar = profilePicture;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    // 3. Generate JWT token
    const token = generateToken(user._id, user.role);

    // Prepare response object
    const userObj = user.toObject();
    delete userObj.password;

    return success(res, { token, user: userObj }, 200);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  signup,
  login,
  getProfile,
  googleLogin,
};
