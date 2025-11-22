const pool = require('../config/db');

const userStatsModel = require('./userStatsModel')

const habitModel = {
    getAll: async (userId) => {
        // Fetch all habits
        const result = await pool.query(
            'SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        
        // Check and reset expired streaks for each habit independently
        const now = new Date();
        const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
        
        const habits = result.rows.map(habit => {
            // If habit has a last_check_in and it's more than 48 hours old, reset streak to 0
            if (habit.last_check_in && new Date(habit.last_check_in) < fortyEightHoursAgo && habit.streak > 0) {
                // Update in database
                pool.query(
                    'UPDATE habits SET streak = 0 WHERE id = $1',
                    [habit.id]
                ).catch(err => console.error('Error resetting streak:', err));
                
                // Return updated habit object
                return { ...habit, streak: 0 };
            }
            return habit;
        });
        
        return habits;
    },

    getTotalCheckIns: async (userId) => {
        const result = await pool.query(
            'SELECT COUNT(*) as total FROM check_ins WHERE user_id = $1',
            [userId]
        );
        return parseInt(result.rows[0]?.total || 0);
    },

    create: async (userId, title, description, icon, colour) => {
        const result = await pool.query(
            'INSERT INTO habits (user_id, title, description, icon, colour, streak, last_check_in) VALUES ($1, $2, $3, $4, $5, 0, NULL) RETURNING *',
            [userId, title, description, icon, colour]
        );
        return result.rows[0];
    },

    update: async (habitId, userId, title, description, icon, colour) => {
        const result = await pool.query(
            `UPDATE habits 
             SET title = $1, description = $2, icon = $3, colour = $4 
             WHERE id = $5 AND user_id = $6 
             RETURNING *`,
            [title, description, icon, colour, habitId, userId]
        );
        return result.rows[0];
    },

    getById: async (habitId, userId) => {
        const result = await pool.query(
            'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
            [habitId, userId]
        );
        return result.rows[0];
    },

    checkIn: async (habitId, userId, localDate, imageUrl) => {
        // First, get the habit and check if streak should reset
        const habit = await pool.query(
            'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
            [habitId, userId]
        );

        if (habit.rows.length === 0) {
            throw new Error('Habit not found');
        }

        const currentHabit = habit.rows[0];
        const now = new Date();
        let newStreak = currentHabit.streak || 0;

        // Check if user already checked in today
        if (currentHabit.last_check_in) {
            const lastCheckIn = new Date(currentHabit.last_check_in);
            
            // Convert last_check_in to user's local date (YYYY-MM-DD format)
            const lastCheckInDate = lastCheckIn.toISOString().split('T')[0]; // Get YYYY-MM-DD
            
            // Compare with today's date (from frontend)
            if (lastCheckInDate === localDate) {
                throw new Error('You have already checked in today. Please check in again tomorrow!');
            }

            // Check if more than 48 hours have passed (for streak reset)
            const hoursSinceLastCheckIn = (now - lastCheckIn) / (1000 * 60 * 60);
            
            if (hoursSinceLastCheckIn > 48) {
                // Reset streak to 0 if more than 48 hours have passed
                newStreak = 0;
            } else {
                // Check if it's a new day (for streak continuation)
                if (lastCheckInDate < localDate) {
                    // New day - increment streak
                    newStreak = (currentHabit.streak || 0) + 1;
                } else {
                    // Same day - shouldn't happen due to check above, but just in case
                    throw new Error('You have already checked in today.');
                }
            }
        } else {
            // First check-in
            newStreak = 1;
        }

        const result = await pool.query(
            `UPDATE habits 
            SET streak = $1, last_check_in = $2, image_url = $3
            WHERE id = $4 AND user_id = $5 
            RETURNING *`,
            [newStreak, now, imageUrl || null, habitId, userId]
        );

        // Insert into check_ins table for history
        await pool.query(
            `INSERT INTO check_ins (habit_id, user_id, check_in_date, image_url)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (habit_id, check_in_date) 
             DO UPDATE SET image_url = $4`,
            [habitId, userId, localDate, imageUrl || null]
        );

        // Update user stats
        await userStatsModel.incrementCheckIns(userId);
        await userStatsModel.updateBestStreak(userId, newStreak);

        return result.rows[0];
    },

    delete: async (habitId, userId) => {
        const result = await pool.query(
            'DELETE FROM habits WHERE id = $1 AND user_id = $2 RETURNING *',
            [habitId, userId]
        );
        return result.rows[0];
    },

    // NEW: Check and reset expired streaks (more than 48 hours since last check-in)
    resetExpiredStreaks: async (userId) => {
        const now = new Date();
        const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
        
        const result = await pool.query(
            `UPDATE habits 
            SET streak = 0 
            WHERE user_id = $1 
            AND last_check_in IS NOT NULL 
            AND last_check_in < $2 
            AND streak > 0
            RETURNING id, title`,
            [userId, fortyEightHoursAgo]
        );
        
        return result.rows;
    },

    getBestStreak: async (userId) => {
        const userStatsModel = require('./userStatsModel');
        const userStats = await userStatsModel.get(userId);
        return userStats?.best_streak || 0;
    },

    getTotalCheckIns: async (userId) => {
        const result = await pool.query(
            'SELECT COUNT(*) as total FROM check_ins WHERE user_id = $1',
            [userId]
        );
        return parseInt(result.rows[0]?.total || 0);
    },

    setupTable: async () => {
        await pool.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'habits' AND column_name = 'image_url'
                ) THEN
                    ALTER TABLE habits ADD COLUMN image_url TEXT;
                END IF;
            END $$;
        `);

        // Create check_ins table (only once)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS check_ins (
                id SERIAL PRIMARY KEY,
                habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                check_in_date DATE NOT NULL,
                image_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(habit_id, check_in_date)
            )
        `);

        // Setup user_stats table
        const userStatsModel = require('./userStatsModel');
        await userStatsModel.setupTable();
    },

    getCheckIns: async (habitId, userId) => {
        const result = await pool.query(
            `SELECT * FROM check_ins 
             WHERE habit_id = $1 AND user_id = $2 
             ORDER BY check_in_date DESC`,
            [habitId, userId]
        );
        return result.rows;
    },
};

module.exports = habitModel;