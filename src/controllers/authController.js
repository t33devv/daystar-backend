const { OAuth2Client } = require('google-auth-library');
const userModel = require('../models/userModel');
const { generateToken } = require('../utils/jwt');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authController = {
    // Setup users table
    setupUsersTable: async (req, res, next) => {
        try {
            await userModel.setupTable();
            res.status(200).json({ 
                success: true,
                message: 'Users table created successfully' 
            });
        } catch (error) {
            next(error);
        }
    },

    // Google Sign-In (receive ID token from React Native)
    googleSignIn: async (req, res, next) => {
        try {
            const { idToken } = req.body;

            if (!idToken) {
                return res.status(400).json({ 
                    success: false,
                    error: 'ID token is required' 
                });
            }

            // Verify the Google ID token
            const ticket = await client.verifyIdToken({
                idToken: idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            const googleId = payload['sub'];
            const email = payload['email'];
            const name = payload['name'];
            const picture = payload['picture'];

            // Find or create user
            let user = await userModel.findByGoogleId(googleId);

            if (!user) {
                user = await userModel.createNewUser({
                    googleId,
                    email,
                    name,
                    picture
                });
            }

            // Generate JWT token
            const token = generateToken(user);

            res.status(200).json({
                success: true,
                token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    picture: user.picture
                }
            });

        } catch (error) {
            console.error('Google sign-in error:', error);
            res.status(401).json({ 
                success: false,
                error: 'Invalid Google token' 
            });
        }
    },

    // Verify if JWT token is valid
    verifyToken: (req, res) => {
        res.json({ 
            success: true,
            valid: true, 
            user: {
                id: req.user.id,
                email: req.user.email,
                name: req.user.name,
                picture: req.user.picture
            }
        });
    },

    // Refresh JWT token
    refreshToken: (req, res) => {
        const newToken = generateToken(req.user);
        res.json({ 
            success: true,
            token: newToken 
        });
    }
};

module.exports = authController;