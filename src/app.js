const express = require('express');
const cors = require('cors');
const path = require('path');

const habitRoutes = require('./routes/habits');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());  // ← Add this - allows all origins (for development)
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'API is running', version: '1.0.0' });
});

// Image uploading
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling (must be last)
app.use(errorHandler);

module.exports = app;