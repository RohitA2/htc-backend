const bookingService = require("../services/bookingServices");
const moment  = require("moment");

exports.createBooking = async (req, res) => {
    try {
        const booking = await bookingService.createFullBooking(req.body, req.user.id);
        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: booking,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};



/* ======================= LIST BOOKINGS (PAGINATION) ======================= */
exports.getBookings = async (req, res) => {
    try {
        const result = await bookingService.getBookings(req.query);

        res.status(200).json({
            message: "Bookings fetched successfully",
            ...result,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message || "Failed to fetch bookings",
        });
    }
};

/* ======================= GET BOOKING BY ID ======================= */
exports.getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await bookingService.getBookingById(id);

        res.status(200).json({
            message: "Booking fetched successfully",
            data: booking,
        });
    } catch (error) {
        res.status(404).json({
            message: error.message || "Booking not found",
        });
    }
};

/* ======================= UPDATE BOOKING ======================= */
exports.updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const booking = await bookingService.updateFullBooking(id, req.body, userId);

        res.status(200).json({
            message: "Booking updated successfully",
            data: booking,
        });
    } catch (error) {
        res.status(400).json({
            message: error.message || "Failed to update booking",
        });
    }
};

/* ======================= DELETE BOOKING ======================= */
exports.softDeleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await bookingService.softDeleteBooking(id, userId);

        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            message: error.message || "Failed to delete booking",
        });
    }
};
