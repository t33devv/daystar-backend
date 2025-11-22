const pool = require('../config/db');

const userStatsModel = {
    // Initialize stats for a new user
    initialize: async (userId) => {
        const result = await pool.query(
            `INSERT INTO user_stats (user_id, best_streak, total_check_ins)
             VALUES ($1, 0, 0)
             ON CONFLICT (user_id) DO NOTHING
             RETURNING *`,
            [userId]
        );
        return result.rows[0];
    },

    // Get user stats
    get: async (userId) => {
        const result = await pool.query(
            'SELECT * FROM user_stats WHERE user_id = $1',
            [userId]
        );
        if (result.rows.length === 0) {
            // Initialize if doesn't exist
            return await userStatsModel.initialize(userId);
        }
        return result.rows[0];
    },

    incrementCheckIns: async (userId) => {
        // Ensure user_stats exists first
        await userStatsModel.get(userId);
        
        const result = await pool.query(
            `UPDATE user_stats 
             SET total_check_ins = total_check_ins + 1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1
             RETURNING *`,
            [userId]
        );
        return result.rows[0];
    },

    // Update best streak if new record
    updateBestStreak: async (userId, newStreak) => {
        // First get current best streak
        const current = await userStatsModel.get(userId);
        const currentBest = current?.best_streak || 0;

        // Only update if new streak is higher
        if (newStreak > currentBest) {
            const result = await pool.query(
                `UPDATE user_stats 
                 SET best_streak = $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $2
                 RETURNING *`,
                [newStreak, userId]
            );
            return result.rows[0];
        }
        return current;
    },

    // Setup table
    setupTable: async () => {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_stats (
                user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                best_streak INTEGER DEFAULT 0 NOT NULL,
                total_check_ins INTEGER DEFAULT 0 NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }
};

module.exports = userStatsModel;