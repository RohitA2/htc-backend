// src/models/Truck.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Truck = sequelize.define("Truck", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  truckNo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  tyreCount: DataTypes.INTEGER,
  driverName: DataTypes.STRING,
  driverPhone: DataTypes.STRING,
  transporterName: DataTypes.STRING,
  transporterPhone: DataTypes.STRING,
  status: {
    type: DataTypes.ENUM("Active", "Inactive"),
    defaultValue: "Active",
  },
}, {
  tableName: "Trucks",
  timestamps: true,
});

module.exports = Truck;
