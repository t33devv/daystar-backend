const pool = require('../config/db');

const userModel = {
    updateName: async (userId, name) => {
        const result = await pool.query(
            'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, email, name, picture',
            [name, userId]
        );
        return result.rows[0];
    },

    // Update user password
    updatePassword: async (userId, passwordHash) => {
        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, email, name, picture',
            [passwordHash, userId]
        );
        return result.rows[0];
    },

    // Update both name and password
    updateProfile: async (userId, name, passwordHash) => {
        if (passwordHash) {
            const result = await pool.query(
                'UPDATE users SET name = $1, password_hash = $2 WHERE id = $3 RETURNING id, email, name, picture',
                [name, passwordHash, userId]
            );
            return result.rows[0];
        } else {
            const result = await pool.query(
                'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, email, name, picture',
                [name, userId]
            );
            return result.rows[0];
        }
    },
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

    createWithPassword: async ({ email, passwordHash, name }) => {
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, name, auth_provider)
            VALUES ($1, $2, $3, 'local')
            RETURNING id, email, name, picture, auth_provider, created_at`,
            [email, passwordHash, name]
        );
        return result.rows[0];
    },

    createWithGoogle: async ({ googleId, email, name, picture }) => {
        const result = await pool.query(
            `INSERT INTO users (google_id, email, name, picture, auth_provider)
            VALUES ($1, $2, $3, $4, 'google')
            RETURNING id, email, name, picture, auth_provider, creataed_at`,
            [googleId, email, name, picture]
        )
        return result.rows[0];
    },

    findByEmail: async (email) => {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0];
    },

    // Update user model's createNewUser to use createWithGoogle
    createNewUser: async ({ googleId, email, name, picture }) => {
        return await userModel.createWithGoogle({ googleId, email, name, picture });
    },

    // Just the database query, no req/res
    setupTable: async () => {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            google_id VARCHAR(255) UNIQUE,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
            name VARCHAR(255),
            picture TEXT,
            auth_provider VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        `);
    }
};

module.exports = userModel;