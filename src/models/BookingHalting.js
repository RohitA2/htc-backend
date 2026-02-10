const DataTypes = require('sequelize');
const { sequelize } = require("../config/database");


const BookingHalting = sequelize.define("BookingHalting", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    bookingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    truckId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    pricePerDay: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },

    days: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    paymentStatus: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
    },
  reason: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    haltingDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },

    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: "BookingHalting",
    timestamps: true,
});

module.exports = BookingHalting;