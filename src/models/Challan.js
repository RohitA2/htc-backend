const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Challan = sequelize.define(
    "Challan",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        challanNo: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },

        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },

        /* 🚛 TRUCK & DRIVER DETAILS */
        truckNo: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        driverName: {
            type: DataTypes.STRING,
        },

        driverMobileNo: {
            type: DataTypes.STRING,
        },

        ownerMobileNo: {
            type: DataTypes.STRING,
        },

        /* 📄 DOCUMENT FILES (store path / filename) */
        registrationCard: DataTypes.STRING,
        gadiPhoto: DataTypes.STRING,
        insuranceCopy: DataTypes.STRING,
        driverLicence: DataTypes.STRING,
        driverPhoto: DataTypes.STRING,
        aadharCardFile: DataTypes.STRING,
        panCardFile: DataTypes.STRING,
        tdsCertificate: DataTypes.STRING,
        bankPassbookOrCancelCheque: DataTypes.STRING,

        /* 🆔 ID DETAILS */
        aadharCardNumber: DataTypes.STRING,
        panCardNumber: DataTypes.STRING,

        /* 🏦 BANK DETAILS */
        acHolderName: DataTypes.STRING,
        accountNo: DataTypes.STRING,
        ifscCode: DataTypes.STRING,
        bankName: DataTypes.STRING,
        branch: DataTypes.STRING,
        linkAc: DataTypes.STRING,

        /* 👥 GUARANTOR DETAILS */
        guarantorName1: DataTypes.STRING,
        guarantorAddress1: DataTypes.TEXT,
        guarantorMobile1: DataTypes.STRING,

        guarantorName2: DataTypes.STRING,
        guarantorAddress2: DataTypes.TEXT,
        guarantorMobile2: DataTypes.STRING,

        /* 🏢 PARTY & ROUTE */
        partyName: DataTypes.STRING,

        lastLoadingFrom: DataTypes.STRING,
        lastUnloadingTo: DataTypes.STRING,
        bookingId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Bookings',
                key: 'id'
            }
        },

        preparedBy: {
            type: DataTypes.STRING,
        },

        /* 🗑️ SOFT DELETE */
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        tableName: "Challans",
        timestamps: true,
    }
);

module.exports = Challan;
