const pool = require('../config/db');

const userModel = {
    // Find user by ID
    findById: async (id) => {
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    },

    // Find user by Google ID
    findByGoogleId: async (googleId) => {
        const result = await pool.query(
            'SELECT * FROM users WHERE google_id = $1',
            [googleId]
        );
        return result.rows[0];
    },

    // Create new user
    createNewUser: async ({ googleId, email, name, picture }) => {
        const result = await pool.query(
            `INSERT INTO users (google_id, email, name, picture) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [googleId, email, name, picture]
        );
        return result.rows[0];
    },

    // Just the database query, no req/res
    setupTable: async () => {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                google_id VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                picture TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }
};

module.exports = userModel;