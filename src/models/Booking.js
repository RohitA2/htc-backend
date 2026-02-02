// src/models/Booking.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Booking = sequelize.define(
    "Booking",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        bookingType: {
            type: DataTypes.STRING,
            defaultValue: "normal",
        },

        commodity: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        rate: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        truckRate: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },

        weight: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },

        weightType: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        fromLocation: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        toLocation: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        truckId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Trucks",
                key: "id",
            },
        },
        partyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Party",
                key: "id",
            },
        },

        updateBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Users",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
        },

        companyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Companies",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
        },

        partyFreight: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },

        truckFreight: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        differenceAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
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

        status: {
            type: DataTypes.ENUM("pending", "complete"),
            defaultValue: "pending",
        },
    },
    {
        tableName: "Bookings",
        timestamps: true,
    }
);

module.exports = Booking;
