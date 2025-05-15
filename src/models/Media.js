const { sequelize } = require("../config/database"); // Correct path to sequelize instance
const { DataTypes } = require("sequelize");


const Media = sequelize.define(
  "Media",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    messageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    mediaDetails:{
      type: DataTypes.STRING,
      allowNull: true,
    }
  },
  {
    tableName: "Media",
    timestamps: true,
  }
);

module.exports = Media; // Export the model
