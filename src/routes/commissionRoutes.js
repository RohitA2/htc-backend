const express = require("express");
const router = express.Router();

const commissionController = require("../controllers/commission");


router.get("/commission-ledger", commissionController.getCommissionLedger);



module.exports = router;
