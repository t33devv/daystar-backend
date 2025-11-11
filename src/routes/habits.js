const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const { authenticateToken } = require('../middleware/authToken');

// Setup database
router.post('/setup', habitController.setupDatabase);

// All routes below require JWT token
router.get('/', authenticateToken, habitController.getAllHabits);
router.post('/', authenticateToken, habitController.createHabit);
router.get('/protected', authenticateToken, habitController.protectedRoute);

module.exports = router;