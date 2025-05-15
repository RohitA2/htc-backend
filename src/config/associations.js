const fs = require('fs');
const path = require('path');
const { DataTypes } = require('sequelize');
const sequelize = require('./database');  // Adjust path as needed

const models = {};

// Dynamically load all models
fs.readdirSync(path.join(__dirname, '../models'))  // Adjust path if necessary
  .filter((file) => file.endsWith('.js') && file !== 'index.js')  // Ignore non-JS files or index.js
  .forEach((file) => {
    const model = require(path.join(__dirname, '../models', file));  // Pass sequelize and DataTypes
    models[model.name] = model;
  });

// Define associations (if they exist in models)
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);  // Associate models if they have the associate method
  }
});

// Now, `sequelize.models` holds all your models
sequelize.models = models;

const defineAssociations = () => {
  // Example of associations (modify according to your models)

    models.User.hasMany(models.Transaction, { 
      foreignKey: 'user_id', 
      as: 'transactions',
    });

    models.Transaction.belongsTo(models.User, {
      foreignKey: 'target_user_id',
      as: 'targetUser',
    });

};

module.exports = defineAssociations;
