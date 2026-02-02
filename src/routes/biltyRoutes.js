const express = require("express");
const router = express.Router();
const biltyController = require("../controllers/biltyController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.post("/create", biltyController.createBilty);
router.get("/pagination", biltyController.getBiltyList);
router.get("/get/:id", biltyController.getBiltyById);
router.post("/update/:id", biltyController.updateBilty);
router.delete("/delete/:id", biltyController.deleteBilty);
router.get("/upsert", biltyController.createOrUpdateBilty);
router.get('/booking/:bookingId', biltyController.getBiltyByBookingId);

module.exports = router;
