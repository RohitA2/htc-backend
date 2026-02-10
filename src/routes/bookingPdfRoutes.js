// routes/bookingPdfRoutes.js
const express = require('express');
const router = express.Router();
const bookingPdfController = require('../controllers/bookingPdfController');
const authMiddleware = require("../middleware/authMiddleware");

// Generate Difference Slip
router.get('/difference-slip/:id', bookingPdfController.generateDifferenceSlip);

// Generate Booking Slip
router.get('/booking-slip/:id', bookingPdfController.generateBookingSlip);

// Generate Bilty Slip
router.get('/bilty-slip/:bookingId', authMiddleware, bookingPdfController.getBiltyByBookingId);


// router.get('/details-slip/:bookingId', bookingPdfController.getBiltyByBookingId);

module.exports = router;