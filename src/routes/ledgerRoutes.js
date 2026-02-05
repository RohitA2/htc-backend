const express = require("express");
const router = express.Router();
const ledgerController = require("../controllers/partyLedgerController")
const authMiddleware = require("../middleware/authMiddleware");


router.get("/party", ledgerController.getAllPartyLedgerSummary)


router.get("/party-details/:partyId", ledgerController.getPartyLedgerDetails)




router.post("/party-partial-payment", ledgerController.createPartyPartialPayment);




router.get("/party-tally/:partyId", ledgerController.getPartyTallyLedger)




router.get("/party-list", ledgerController.getPartyListForLedger)







module.exports = router;