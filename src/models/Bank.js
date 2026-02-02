// src/models/Bank.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Bank = sequelize.define(
    "Bank",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        acHolderName: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        accountNo: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },

        branchName: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        IFSCode: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        isPrimary: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },

        companyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Companies",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },

        status: {
            type: DataTypes.ENUM("Active", "Inactive"),
            defaultValue: "Active",
        },
    },
    {
        tableName: "Banks",
        timestamps: true,

        indexes: [
            {
                unique: true,
                fields: ["companyId"],
                where: {
                    isPrimary: true,
                },
            },
        ],
    }
);

module.exports = Bank;
