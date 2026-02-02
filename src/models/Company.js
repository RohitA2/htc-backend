// src/models/Company.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Company = sequelize.define(
    "Company",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        companyName: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        companyAddress: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        // Single company email
        companyEmail: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },

        gstNo: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        panNo: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        // Single contact person
        personName: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        personEmail: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isEmail: true,
            },
        },

        // Single phone number
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        termsAndConditions: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        extraNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM("Active", "Inactive"),
            defaultValue: "Active",
        },
        updateBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "Users",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
        },
    },
    {
        tableName: "Companies",
        timestamps: true,
    }
);

module.exports = Company;
