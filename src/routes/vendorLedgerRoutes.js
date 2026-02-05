const express = require("express");
const router = express.Router();
const vendorLedgerController = require("../controllers/vendorLedgerController")
const authMiddleware = require("../middleware/authMiddleware");


router.get("/truck", vendorLedgerController.getAllTruckLedgerSummary)


router.get("/truck-ledger", vendorLedgerController.getTruckListForLedger)



router.get("/truck-details/:truckId", vendorLedgerController.getTruckLedgerDetails)


router.post("/truck-partial-payment", vendorLedgerController.createTruckPartialPayment);



router.get("/truck-tally/:truckId", vendorLedgerController.getTruckTallyLedger);


module.exports = router;