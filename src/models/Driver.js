const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Driver = sequelize.define('Driver', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    driverName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: DataTypes.STRING,
    licenseNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    licenseExpiry: DataTypes.DATE,
    address: DataTypes.STRING,
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
    }
}, {
    paranoid: true
});

module.exports = Driver;