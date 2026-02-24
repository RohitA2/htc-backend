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
  vehicleType: DataTypes.STRING,
  capacity: DataTypes.FLOAT,

  rcNumber: DataTypes.STRING,
  rcExpiry: DataTypes.DATE,

  insuranceNumber: DataTypes.STRING,
  insuranceExpiry: DataTypes.DATE,

  permitExpiry: DataTypes.DATE,
  fitnessExpiry: DataTypes.DATE,
  pucExpiry: DataTypes.DATE,

  ownerName: DataTypes.STRING,
  ownerContact: DataTypes.STRING,
  status: {
    type: DataTypes.ENUM("Active", "Inactive", "OnTrip"),
    defaultValue: "Active",
  },
}, {
  tableName: "Trucks",
  timestamps: true,
});

module.exports = Truck;
