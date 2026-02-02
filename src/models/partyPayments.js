const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PartyPayments = sequelize.define('PartyPayments', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    bookingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Bookings",
            key: "id",
        },
    },

    partyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
        allowNull: true
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
    remarks: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bankId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "Banks",
            key: "id",
        },

    }

}, {
    tableName: 'PartyPayments',
    timestamps: true,
});

module.exports = PartyPayments;