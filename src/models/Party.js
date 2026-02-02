const { sequelize } = require("../config/database"); 
const { DataTypes } = require("sequelize");

const Party = sequelize.define("Party", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    partyName: DataTypes.STRING,
    partyPhone: DataTypes.STRING,
    partyAddress: DataTypes.STRING,
    status: {
        type: DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active",
    },
},
    {
        tableName: "Party",
        timestamps: true,
    });

module.exports = Party;
