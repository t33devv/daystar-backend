const pool = require('../config/db');

const habitModel = {
    getAll: async () => {
        const result = await pool.query('SELECT * FROM habits');
        return result.rows;
    },

    create: async (title, description, colour) => {
        const result = await pool.query(
            'INSERT INTO habits (title, description, colour) VALUES ($1, $2, $3) RETURNING *',
            [title, description, colour]
        );
        return result.rows[0];
    },

    setupTable: async () => {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS habits (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                colour VARCHAR(50)
            )
        `);
    }
};

module.exports = habitModel;