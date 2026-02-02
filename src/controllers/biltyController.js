const myServices = require("../services/myServices");
const db = require("../config/database");
const { where } = require("sequelize");

/* ===================== CREATE BILTY ===================== */
exports.createBilty = async (req, res) => {
    try {
        const result = await myServices.create(db.models.Bilty, req.body);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/* ===================== GET BILTY BY ID ===================== */
exports.getBiltyById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await myServices.read(
            db.models.Bilty,
            id,
            [
                {
                    model: db.models.Booking,
                    as: "booking",
                },
            ]
        );

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/* ===================== UPDATE BILTY ===================== */
exports.updateBilty = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await myServices.update(db.models.Bilty, id, req.body);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/* ===================== DELETE BILTY ===================== */
exports.deleteBilty = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await myServices.delete(db.models.Bilty, id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/* ===================== LIST BILTY (PAGINATION) ===================== */
exports.getBiltyList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const where = {};
        if (req.query.bookingId) {
            where.bookingId = req.query.bookingId;
        }

        const result = await myServices.listPagination(
            db.models.Bilty,
            [
                {
                    model: db.models.Booking,
                    as: "booking",
                },
            ],
            page,
            limit,
            where
        );

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// ++++++++++++++++++++++++upsert++++++++++++++++
exports.createOrUpdateBilty = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const existingBilty = await db.models.Bilty.findOne({ where: { bookingId } });

        if (existingBilty) {
            // Update existing bilty
            await existingBilty.update(req.body);
            res.json(existingBilty);
        } else {
            // Create new bilty
            const bilty = await db.models.Bilty.create(req.body);
            res.status(201).json(bilty);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBiltyByBookingId = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const bilty = await db.models.Bilty.findOne({ where: { bookingId } });
        res.json(bilty);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};