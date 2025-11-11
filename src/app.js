const express = require('express');
const habitRoutes = require('./routes/habits');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'API is running', version: '1.0.0' });
});

// Error handling (must be last)
app.use(errorHandler);

module.exports = app;