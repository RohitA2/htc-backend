// src/models/Transaction.js
const { sequelize } = require('../config/database'); 
const { DataTypes } = require('sequelize');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  balance_after: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  target_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Completed', 'Failed'),
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  payment_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  gateway_details: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  tableName: 'Transactions',
  timestamps: true,
});

// Don't forget to return the model here
module.exports = Transaction;
