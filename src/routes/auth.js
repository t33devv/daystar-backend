const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authToken');

// Setup database
router.post('/setup', authController.setupUsersTable);

router.post('/register', authController.register);
router.post('/login', authController.login);

// Google Sign-In (from React Native)
router.post('/google', authController.googleSignIn);

// Verify token
router.get('/verify', authenticateToken, authController.verifyToken);

// Refresh token
router.post('/refresh', authenticateToken, authController.refreshToken);

// Update profile (requires authentication)
router.put('/profile', authenticateToken, authController.updateProfile);

module.exports = router;