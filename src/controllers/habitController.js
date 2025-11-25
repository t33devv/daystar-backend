const habitModel = require('../models/habitModel');

const userStatsModel = require('../models/userStatsModel')

const upload = require('../middleware/upload')

const habitController = {
    getAllHabits: async (req, res, next) => {
        try {
            const userId = req.user.id;
            
            // Reset any expired streaks first (for habits that haven't been checked in > 48 hours)
            await habitModel.resetExpiredStreaks(userId);
            
            // Then fetch all habits (which will also check expiration)
            const habits = await habitModel.getAll(userId);
            
            res.status(200).json({ 
                success: true,
                habits 
            });
        } catch (error) {
            next(error);
        }
    },

    getStats: async (req, res, next) => {
        try {
            const userId = req.user.id;
            
            // Reset expired streaks first
            await habitModel.resetExpiredStreaks(userId);
            
            // Fetch habits for active habits count
            const habits = await habitModel.getAll(userId);
            
            // Get stats from user_stats table (persistent even after habit deletion)
            const userStats = await userStatsModel.get(userId);

            res.status(200).json({ 
                success: true,
                stats: {
                    activeHabits: habits.filter(h => h.streak > 0 || h.last_check_in !== null).length,
                    bestStreak: userStats.best_streak || 0,
                    totalCheckIns: userStats.total_check_ins || 0
                }
            });
        } catch (error) {
            next(error);
        }
    },

    uploadImage: async (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No image file provided'
                });
            }

            // Upload to Cloudinary
            const imageUrl = await upload.uploadToCloudinary(
                req.file.buffer,
                req.file.originalname
            );
            
            res.status(200).json({
                success: true,
                imageUrl: imageUrl,
                message: 'Image uploaded successfully'
            });
        } catch (error) {
            console.error('Image upload error:', error);
            next(error);
        }
    },


    createHabit: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { title, description, icon, colour } = req.body;

            if (!title) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Habit title is required' 
                });
            }

            const habit = await habitModel.create(userId, title, description, icon, colour);
            res.status(201).json({ 
                success: true,
                message: 'Habit created successfully', 
                habit 
            });
        } catch (error) {
            next(error);
        }
    },

    updateHabit: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const habitId = req.params.id;
            const { title, description, icon, colour } = req.body;

            if (!title) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Habit title is required' 
                });
            }

            const existingHabit = await habitModel.getById(habitId, userId);
            if (!existingHabit) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Habit not found' 
                });
            }

            const habit = await habitModel.update(habitId, userId, title, description, icon, colour);
            res.status(200).json({ 
                success: true,
                message: 'Habit updated successfully', 
                habit 
            });
        } catch (error) {
            next(error);
        }
    },

    checkIn: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const habitId = req.params.id;
            const { localDate, imageUrl } = req.body; // Get local date from frontend

            if (!localDate) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Local date is required' 
                });
            }

            // Verify habit belongs to user
            const existingHabit = await habitModel.getById(habitId, userId);
            if (!existingHabit) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Habit not found' 
                });
            }

            const habit = await habitModel.checkIn(habitId, userId, localDate, imageUrl);
            res.status(200).json({ 
                success: true,
                message: 'Check-in successful!',
                habit 
            });
        } catch (error) {
            // Handle "already checked in" error
            if (error.message.includes('already checked in')) {
                return res.status(400).json({ 
                    success: false,
                    error: error.message 
                });
            }
            next(error);
        }
    },

    getCheckIns: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const habitId = req.params.id;

            // Verify habit belongs to user
            const existingHabit = await habitModel.getById(habitId, userId);
            if (!existingHabit) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Habit not found' 
                });
            }

            const checkIns = await habitModel.getCheckIns(habitId, userId);
            res.status(200).json({ 
                success: true,
                checkIns 
            });
        } catch (error) {
            next(error);
        }
    },

    deleteHabit: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const habitId = req.params.id;

            // Verify habit belongs to user
            const existingHabit = await habitModel.getById(habitId, userId);
            if (!existingHabit) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Habit not found' 
                });
            }

            await habitModel.delete(habitId, userId);
            res.status(200).json({ 
                success: true,
                message: 'Habit deleted successfully' 
            });
        } catch (error) {
            next(error);
        }
    },

    setupDatabase: async (req, res, next) => {
        try {
            await habitModel.setupTable();
            res.status(200).json({ 
                success: true,
                message: 'Database setup successful' 
            });
        } catch (error) {
            next(error);
        }
    },

    protectedRoute: async (req, res, next) => {
        res.json({ message: "Hello!", user: req.user });
    }
};

module.exports = habitController;