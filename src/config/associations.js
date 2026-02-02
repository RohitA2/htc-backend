const fs = require('fs');
const path = require('path');
const { DataTypes } = require('sequelize');
const sequelize = require('./database');  // Adjust path as needed

const models = {};

// Dynamically load all models
fs.readdirSync(path.join(__dirname, '../models'))  // Adjust path if necessary
  .filter((file) => file.endsWith('.js') && file !== 'index.js')  // Ignore non-JS files or index.js
  .forEach((file) => {
    const model = require(path.join(__dirname, '../models', file));  // Pass sequelize and DataTypes
    models[model.name] = model;
  });

// Define associations (if they exist in models)
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);  // Associate models if they have the associate method
  }
});

// Now, `sequelize.models` holds all your models
sequelize.models = models;

const defineAssociations = () => {

  /* ======================= COMPANY ASSOCIATIONS  ======================= */

  models.Company.belongsTo(models.User, { foreignKey: "updateBy", as: "updatedByUser" });
  models.User.hasMany(models.Company, { foreignKey: "updateBy" });

  models.Company.hasMany(models.Bank, { foreignKey: "companyId", as: "banks" });
  models.Bank.belongsTo(models.Company, { foreignKey: "companyId", as: "company" });

  // Company → Bookings (1 : M)
  models.Company.hasMany(models.Booking, { foreignKey: "companyId", as: "bookings", });
  models.Booking.belongsTo(models.Company, { foreignKey: "companyId", as: "company", });


  /* ======================= USER ASSOCIATIONS ======================= */

  // User → Bookings (1 : M)
  models.User.hasMany(models.Booking, { foreignKey: "updateBy", as: "updatedBookings", });
  models.Booking.belongsTo(models.User, { foreignKey: "updateBy", as: "updatedByUser", });

  /* ======================= PARTY → BOOKING ASSOCIATIONS ======================= */
  models.Party.hasMany(models.Booking, { foreignKey: "partyId", as: "bookings", });
  models.Booking.belongsTo(models.Party, { foreignKey: "partyId", as: "party",});

  /* ======================= TRUCK → BOOKINGS ASSOCIATIONS ======================= */
  models.Truck.hasMany(models.Booking, { foreignKey: "truckId" , as: "bookings",});
  models.Booking.belongsTo(models.Truck, { foreignKey: "truckId" , as: "truck",});

  /* ======================= BOOKING → PARTY PAYMENTS (💰 CREDIT) ASSOCIATIONS ======================= */
  models.Booking.hasMany(models.PartyPayments, { foreignKey: "bookingId", as: "partyPayments", });
  models.PartyPayments.belongsTo(models.Booking, { foreignKey: "bookingId", });

  /* =======================BOOKING → TRUCK PAYMENTS (🚛 DEBIT) ASSOCIATIONS ======================= */
  models.Booking.hasMany(models.TruckPayments, { foreignKey: "bookingId", as: "truckPayments", });
  models.TruckPayments.belongsTo(models.Booking, { foreignKey: "bookingId", });

  /* =======================BOOKING → COMMISSIONS (🧾 INCOME) ASSOCIATIONS ======================= */
  models.Booking.hasMany(models.Commission, { foreignKey: "bookingId", as: "commissions", });
  models.Commission.belongsTo(models.Booking, { foreignKey: "bookingId", });


  /* =======================BOOKING → BILTY (🧾 INCOME) ASSOCIATIONS ======================= */
  models.Booking.hasMany(models.Bilty, { foreignKey: "bookingId", });
  models.Bilty.belongsTo(models.Booking, { foreignKey: "bookingId", });

  /* =======================  BILTY → PARTY (🧾 INCOME) ASSOCIATIONS ======================= */

  models.Bilty.belongsTo(models.Party, { foreignKey: 'partyId',as: "party", });
  models.Party.hasMany(models.Bilty, { foreignKey: 'partyId' , as: "bilties",});


};

module.exports = defineAssociations;
