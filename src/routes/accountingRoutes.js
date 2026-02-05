const express = require("express");
const router = express.Router();

const accountingController = require("../controllers/accounting");


router.get("/day-book", accountingController.getDayBook);


router.get("/trial-balance", accountingController.getTrialBalance);


router.get("/profit-loss", accountingController.getProfitLoss);


router.get("/balance-sheet", accountingController.getBalanceSheet);

module.exports = router;
