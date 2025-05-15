const { sequelize } = require('../config/database'); // Correct path to sequelize instance
const { DataTypes } = require('sequelize');

const Group = sequelize.define('Group', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId:{
    type:DataTypes.INTEGER,
    allowNull:true,
  },
}, {
  tableName: 'Groups',
  timestamps: true,
});

module.exports= Group;
