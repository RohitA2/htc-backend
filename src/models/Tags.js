const database = require("../config/database");
const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");

const Tags = sequelize.define(
  "Tags",
  {
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "Tags",
    timestamps: true,
  }
);

module.exports = Tags;
