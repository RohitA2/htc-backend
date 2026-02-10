// routes/index.js
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const uploadRoutes = require('./uploadRoutes');
const companyRoutes = require('./companyRoutes');
const bankRoutes = require("./bankRoutes");
const partyRoutes = require("./partyRoutes");
const bookingRoutes = require("./bookingRoutes");
const bookingPdfRoutes = require('./bookingPdfRoutes');
const biltyRoutes = require("./biltyRoutes");
const challanRoutes = require("./challanRoutes")
const ledgerRoutes = require("./ledgerRoutes")
const vendorLedgerRoutes = require("./vendorLedgerRoutes")
const accountingRoutes = require("./accountingRoutes")
const commissionRoutes = require("./commissionRoutes")


module.exports = (app) => {

  // Authentication routes for all roles
  app.use('/api/users', userRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api', uploadRoutes);
  app.use('/api/company', companyRoutes);
  app.use('/api/bank', bankRoutes);
  app.use('/api/party', partyRoutes);
  app.use('/api/booking', bookingRoutes);
  app.use('/api/pdf', bookingPdfRoutes);
  app.use('/api/bilty', biltyRoutes);
  app.use("/api/challans", challanRoutes);
  app.use("/api/ledger", ledgerRoutes)
  app.use("/api/vendor", vendorLedgerRoutes)
  app.use("/api/accounting", accountingRoutes)
  app.use("/api/commission", commissionRoutes)



};
