const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email,
            googleId: user.google_id
        },
        JWT_SECRET,
        { expiresIn: '7d' } // Token expires in 7 days
    );
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = { generateToken, verifyToken };