const express = require('express');
const userController = require('../controllers/userController'); // Assuming the controller is in the controllers folder

const router = express.Router();

// Routes
router.post('/create', userController.create); // Create a user
router.get('/list/:id', userController.read); // Get a user by ID
router.post('/update/:id', userController.update); // Update a user by ID
router.post('/users/:id', userController.delete); // Delete a user by ID
router.get('/list', userController.list); // List all users
router.get('/list/paginated', userController.listPagination); // Paginated list of users

module.exports = router;
