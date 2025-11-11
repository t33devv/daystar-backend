const { verifyToken } = require('../utils/jwt');
const userModel = require('../models/userModel');

const authenticateToken = async (req, res, next) => {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Attach user to request
    try {
        const user = await userModel.findById(decoded.id);
        if (!user) {
            return res.status(403).json({ error: 'User not found' });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Authentication error' });
    }
};

module.exports = { authenticateToken };