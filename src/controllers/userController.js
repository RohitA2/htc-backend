const myServices = require('../services/myServices');
const db = require('../config/database'); // Correct path to sequelize instance

// Create a new user
exports.create = async (req, res) => {
  try {
    const userData = req.body;
    const newUser = await myServices.create(db.models.User, userData);

    if (!newUser.success) {
      return res.status(400).json(newUser);
    }

    return res.status(200).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Read a user by ID
exports.read = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await myServices.read(db.models.User, id);

    if (!user.success) {
      return res.status(404).json(user);
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update a user by ID
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    const updatedUser = await myServices.update(db.models.User, id, userData);

    if (!updatedUser.success) {
      return res.status(404).json(updatedUser);
    }

    return res.status(200).json(updatedUser);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a user by ID
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deletionResult = await myServices.delete(db.models.User, id);

    if (!deletionResult.success) {
      return res.status(404).json(deletionResult);
    }

    return res.status(200).json(deletionResult);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// List all users
exports.list = async (req, res) => {
  try {
    const { include, where, limit, offset } = req.query;
    const users = await myServices.list(db.models.User, include, where, limit, offset);

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// List users with pagination
exports.listPagination = async (req, res) => {
  try {
    const { include, page, limit, where } = req.query;
    const paginatedUsers = await myServices.listPagination(db.models.User, include, page, limit, where);

    return res.status(200).json(paginatedUsers);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
