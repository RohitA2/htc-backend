const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const challanController = require("../controllers/challanController");

/**
 * CREATE CHALLAN
 */
router.post(
  "/create",
  upload.fields([
    { name: "registrationCard", maxCount: 1 },
    { name: "gadiPhoto", maxCount: 1 },
    { name: "insuranceCopy", maxCount: 1 },
    { name: "driverLicence", maxCount: 1 },
    { name: "driverPhoto", maxCount: 1 },
    { name: "aadharCardFile", maxCount: 1 },
    { name: "panCardFile", maxCount: 1 },
    { name: "tdsCertificate", maxCount: 1 },
    { name: "bankPassbookOrCancelCheque", maxCount: 1 },
  ]),
  challanController.createChallan
);

/**
 * LIST CHALLANS
 */
router.get("/pagination", challanController.listChallans);

/**
 * GET SINGLE CHALLAN
 */
router.get("/:id", challanController.getChallanById);

/**
 * UPDATE CHALLAN
 */
router.put(
  "/update/:id",
  upload.any(), // allow updating any file
  challanController.updateChallan
);

/**
 * DELETE CHALLAN (soft delete recommended)
 */
router.delete("/:id", challanController.deleteChallan);

module.exports = router;
