const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const { authenticateToken } = require('../middleware/authToken');

// Setup database
router.post('/setup', habitController.setupDatabase);

// All routes below require JWT token
router.get('/', authenticateToken, habitController.getAllHabits);
router.post('/', authenticateToken, habitController.createHabit);
router.put('/:id', authenticateToken, habitController.updateHabit);
router.post('/:id/checkin', authenticateToken, habitController.checkIn); // NEW: Check-in route
router.get('/stats', authenticateToken, habitController.getStats); // NEW: Stats route
router.get('/protected', authenticateToken, habitController.protectedRoute);

module.exports = router;