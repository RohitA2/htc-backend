const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VehicleNotification = sequelize.define('VehicleNotification', {

    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    truckId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    docType: {
        type: DataTypes.ENUM(
            'RC',
            'INSURANCE',
            'PERMIT',
            'FITNESS',
            'PUC',
            'LICENSE',
            'TEMP_LICENSE'
        ),
        allowNull: false
    },

    expiryDate: {
        type: DataTypes.DATE,
        allowNull: false
    },

    notified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    isResolved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }

}, {
    paranoid: true
});

module.exports = VehicleNotification;