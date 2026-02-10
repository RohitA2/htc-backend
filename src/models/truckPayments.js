const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TruckPayments = sequelize.define('TruckPayments', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    truckId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    bookingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Bookings",
            key: "id",
        },
    },

    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    paymentDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    paymentMode: {
        type: DataTypes.ENUM("cash", "bank"),
        allowNull: false,
    },
    paymentType: {
        type: DataTypes.ENUM("Credit", "Debit"),
        defaultValue: "Debit",
    },
    bankAccountNo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    bankName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    ifscCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    utrNo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    paymentFor: {
        type: DataTypes.ENUM("freight", "halting"),
        defaultValue: "freight",
    },
    PanNumber: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    remarks: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    deletedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },

});

module.exports = TruckPayments;