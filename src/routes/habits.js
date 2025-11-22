const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const { authenticateToken } = require('../middleware/authToken');
const upload = require('../middleware/upload');

// Setup database
router.post('/setup', habitController.setupDatabase);

// Upload image endpoint
router.post('/upload-image', authenticateToken, upload.single('image'), habitController.uploadImage);

// All routes below require JWT token
router.get('/', authenticateToken, habitController.getAllHabits);
router.post('/', authenticateToken, habitController.createHabit);
router.put('/:id', authenticateToken, habitController.updateHabit);
router.delete('/:id', authenticateToken, habitController.deleteHabit);
router.get('/:id/checkins', authenticateToken, habitController.getCheckIns);
router.post('/:id/checkin', authenticateToken, habitController.checkIn);
router.get('/stats', authenticateToken, habitController.getStats);

module.exports = router;