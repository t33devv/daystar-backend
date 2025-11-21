const habitModel = require('../models/habitModel');

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
            
            // Then fetch habits (which will also check expiration)
            const habits = await habitModel.getAll(userId);
            const bestStreak = await habitModel.getBestStreak(userId);
            const totalCheckIns = await habitModel.getTotalCheckIns(userId);

            res.status(200).json({ 
                success: true,
                stats: {
                    activeHabits: habits.filter(h => h.streak > 0 || h.last_check_in !== null).length,
                    bestStreak: bestStreak,
                    totalCheckIns: totalCheckIns
                }
            });
        } catch (error) {
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

    // NEW: Check in to habit
    checkIn: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const habitId = req.params.id;
            const { localDate } = req.body; // Get local date from frontend

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

            const habit = await habitModel.checkIn(habitId, userId, localDate);
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

    // NEW: Get user stats
    getStats: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const habits = await habitModel.getAll(userId);
            const bestStreak = await habitModel.getBestStreak(userId);
            const totalCheckIns = await habitModel.getTotalCheckIns(userId);

            res.status(200).json({ 
                success: true,
                stats: {
                    activeHabits: habits.length,
                    bestStreak: bestStreak,
                    totalCheckIns: totalCheckIns
                }
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