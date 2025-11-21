const { OAuth2Client } = require('google-auth-library');
const userModel = require('../models/userModel');
const { generateToken } = require('../utils/jwt');

const bcrypt = require('bcrypt');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const SALT_ROUNDS = 10;

const { validateEmail, validatePassword } = require('../utils/validation');
const { json } = require('express');

const authController = {

    updateProfile: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { name, password } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: 'Name is required'
                });
            }

            let passwordHash = null;
            if (password) {
                // Validate password if provided
                const passwordValidation = validatePassword(password);
                if (!passwordValidation.valid) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid password',
                        details: passwordValidation.errors
                    });
                }
                passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
            }

            const updatedUser = await userModel.updateProfile(userId, name, passwordHash);
            
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    name: updatedUser.name,
                    picture: updatedUser.picture
                }
            });
        } catch (error) {
            console.error('Update profile error:', error);
            next(error);
        }
    },
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

    checkPassword: async (req, res, next) => {
        try {
            const { password } = req.body;

            const passwordValidation = validatePassword(password);
            if (!passwordValidation) {
                return res.status(400).json({
                    success: false,
                    details: passwordValidation.errors
                })
            }
        } catch (error) {
            console.error('Password check} error:', error);
            next(error);
        }
    },

    register: async (req, res, next) => {
        try {
            const { email, password, name } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email and password are required'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'Password must be at least 6 characters'
                })
            }

            if (!validateEmail(email)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid email format'
                });
            }

            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
                return res.status(400).json({
                    success: false,
                    errors: 'Password does not meet requirements',
                    details: passwordValidation.errors
                });
            }

            const existingUser = await userModel.findByEmail(email);

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: 'Email already registered'
                })
            }

            const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

            const user = await userModel.createWithPassword({
                email,
                passwordHash,
                name: name || email.split('@')[0]
            });

            const token = generateToken(user);

            res.status(201).json({
                success: true,
                token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    picture: user.picture
                }
            })
        } catch (error) {
            console.error('Registration error:', error);
            next(error);
        }
    },
    
    login: async (req, res, next) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email and password are required'
                });
            }

            const user = await userModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }

            if (user.auth_provider === 'google') {
                return res.status(400).json({
                    success: false,
                    error: 'This email is registered with Google. Please sign in with Google.'
                });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }

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
            console.log('Login error:', error);
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
    },

};

module.exports = authController;