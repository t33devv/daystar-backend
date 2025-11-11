const habitModel = require('../models/habitModel');

const habitController = {
    getAllHabits: async (req, res, next) => {
        try {
            const habits = await habitModel.getAll();
            res.status(200).json({ message: habits });
        } catch (error) {
            next(error);
        }
    },

    createHabit: async (req, res, next) => {
        try {
            const { title, description, colour } = req.body;
            const habit = await habitModel.create(title, description, colour);
            res.status(201).json({ message: 'Habit added successfully', habit });
        } catch (error) {
            next(error);
        }
    },

    setupDatabase: async (req, res, next) => {
        try {
            await habitModel.setupTable();
            res.status(200).json({ message: 'Database setup successful' });
        } catch (error) {
            next(error);
        }
    },

    protectedRoute: async (req, res, next) => {
        res.send("Hello!");
    }
};

module.exports = habitController;