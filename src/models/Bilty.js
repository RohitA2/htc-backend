const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");


const Bilty = sequelize.define('Bilty', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    bookingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Bookings',
            key: 'id'
        }
    },
    partyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Party',
            key: 'id'
        }
    },
    biltyDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    bookingSlipDate: {
        type: DataTypes.STRING
    },
    billyDesignToCompany: {
        type: DataTypes.STRING
    },
    fromLocation: {
        type: DataTypes.STRING
    },
    toLocation: {
        type: DataTypes.STRING
    },
    deliveryAddress: {
        type: DataTypes.TEXT
    },
    truckNo: {
        type: DataTypes.STRING
    },
    partyGST: {
        type: DataTypes.STRING
    },
    consigneeReceiver: {
        type: DataTypes.STRING
    },
    receiverGST: {
        type: DataTypes.STRING
    },
    noOfArticles: {
        type: DataTypes.STRING
    },
    particular: {
        type: DataTypes.STRING
    },
    weightType: {
        type: DataTypes.STRING
    },
    weight: {
        type: DataTypes.DECIMAL(10, 2)
    },
    rate: {
        type: DataTypes.DECIMAL(10, 2)
    },
    rateType: {
        type: DataTypes.STRING
    },
    totalFreightAmt: {
        type: DataTypes.DECIMAL(12, 2)
    },
    remarks: {
        type: DataTypes.TEXT
    },
    advanced: {
        type: DataTypes.DECIMAL(10, 2)
    },
    received: {
        type: DataTypes.DECIMAL(10, 2)
    },
    deduction: {
        type: DataTypes.DECIMAL(10, 2)
    },
    balance: {
        type: DataTypes.DECIMAL(10, 2)
    },
    invoiceNo: {
        type: DataTypes.STRING
    },
    partyPhone: {
        type: DataTypes.STRING
    },
    goodsValue: {
        type: DataTypes.DECIMAL(12, 2)
    },
    remark: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'Bilties',
    timestamps: true
});

module.exports = Bilty