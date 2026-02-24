const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TripAssignment = sequelize.define('TripAssignment', {

    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    bookingId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    truckId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    driverId: {
        type: DataTypes.INTEGER,
        allowNull: true   // optional
    },

    // if market driver
    driverName: DataTypes.STRING,
    driverPhone: DataTypes.STRING,
    licenseNumber: DataTypes.STRING,
    licenseExpiry: DataTypes.DATE,
    tripStatus: {
        type: DataTypes.ENUM('Assigned', 'Completed'),
        defaultValue: 'Assigned'
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    assignedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }

}, {
    paranoid: true
});

module.exports = TripAssignment;