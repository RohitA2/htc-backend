const express = require("express");
const router = express.Router();
const bankController = require("../controllers/bankController");

// Create
router.post("/create", bankController.createBank);

// Read
router.get("/get/:id", bankController.getBankById);
router.get("/list", bankController.getAllBanks);
router.get("/pagination", bankController.getBanksPagination);

// Update
router.put("/update/:id", bankController.updateBank);

// Delete
router.delete("/delete/:id", bankController.deleteBank);

router.get("/list/:id", bankController.bankListByCompanyId)

module.exports = router;
