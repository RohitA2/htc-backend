const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/create", authMiddleware, bookingController.createBooking);

router.get("/pagination", authMiddleware, bookingController.getBookings);

router.get("/one/:id", authMiddleware, bookingController.getBookingById);

router.put("/update/:id", authMiddleware, bookingController.updateBooking);

router.delete("/soft-delete/:id", authMiddleware, bookingController.softDeleteBooking);




module.exports = router;