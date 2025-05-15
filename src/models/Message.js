const { sequelize } = require("../config/database"); // Correct path to sequelize instance
const { DataTypes } = require("sequelize");

const Message = sequelize.define(
  'Message',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: true, // User or Agent ID
    },

    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false, 
      references: {
        model: 'Groups',
        key: 'id',
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true, 
    },
    messageType: {
      type: DataTypes.STRING,
      defaultValue: 'text',
    },
    attachments: {
      type: DataTypes.JSON, 
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN, 
      defaultValue: false,
    },
    message:{
      type: DataTypes.STRING,
      allowNull: true,
    },readBy: {
      type: DataTypes.JSON, // Storing readBy as a JSON field (array of userIds)
      defaultValue: [],
    },
  },
  {
    tableName: 'Messages',
    timestamps: true,
  }
);

module.exports = Message;
