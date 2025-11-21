const pool = require('../config/db');

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

    checkIn: async (habitId, userId, localDate) => {
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

        // Update habit with new streak and last_check_in
        const result = await pool.query(
            `UPDATE habits 
            SET streak = $1, last_check_in = $2 
            WHERE id = $3 AND user_id = $4 
            RETURNING *`,
            [newStreak, now, habitId, userId]
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

    // NEW: Get best streak across all habits for a user
    getBestStreak: async (userId) => {
        const result = await pool.query(
            'SELECT MAX(streak) as best_streak FROM habits WHERE user_id = $1',
            [userId]
        );
        return result.rows[0]?.best_streak || 0;
    },

    // NEW: Get total check-ins (sum of all streaks)
    getTotalCheckIns: async (userId) => {
        const result = await pool.query(
            'SELECT SUM(streak) as total FROM habits WHERE user_id = $1',
            [userId]
        );
        return parseInt(result.rows[0]?.total || 0);
    },

    setupTable: async () => {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS habits (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                icon VARCHAR(10),
                colour VARCHAR(50),
                streak INTEGER DEFAULT 0,
                last_check_in TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }
};

module.exports = habitModel;