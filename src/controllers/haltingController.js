const db = require("../config/database");
const { Op } = require("sequelize");
exports.getAllHaltingDetails = async (req, res) => {
    try {
        const { search, fromDate, toDate, paymentStatus } = req.query;

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const dateFilter =
            fromDate && toDate
                ? { [Op.between]: [fromDate, toDate] }
                : fromDate
                    ? { [Op.gte]: fromDate }
                    : toDate
                        ? { [Op.lte]: toDate }
                        : null;

        const whereCondition = {
            isDeleted: false,
            ...(paymentStatus && { paymentStatus }),
            ...(dateFilter && { haltingDate: dateFilter }),
        };

        /* ================= INCLUDE ================= */
        const include = [
            {
                model: db.models.Booking,
                as: "booking",
                attributes: ["id", "fromLocation", "toLocation", "date", "companyId"],
            },
            {
                model: db.models.Truck,
                as: "truck",
                attributes: ["id", "truckNo", "driverName", "transporterName"],
            },
        ];

        /* ================= SEARCH ================= */
        if (search) {
            include[0].where = !isNaN(search)
                ? { id: Number(search) }
                : undefined;

            include[1].where = {
                [Op.or]: [
                    { truckNo: { [Op.iLike]: `%${search}%` } },
                    { driverName: { [Op.iLike]: `%${search}%` } },
                ],
            };
        }

        const { count, rows } = await db.models.BookingHalting.findAndCountAll({
            where: whereCondition,
            include,
            order: [["haltingDate", "DESC"]],
            limit,
            offset,
        });

        /* ================= HALTING PAYMENT DETAILS ================= */
        const data = await Promise.all(
            rows.map(async (h) => {
                const payments = await db.models.TruckPayments.findAll({
                    where: {
                        bookingId: h.bookingId,
                        truckId: h.truckId,
                        isDeleted: false,
                        paymentFor: "halting",
                    },
                    order: [["paymentDate", "ASC"]],
                    attributes: [
                        "id",
                        "amount",
                        "paymentMode",
                        "paymentType",
                        "paymentDate",
                        "utrNo",
                        "bankName",
                    ],
                });

                const haltingPaid = payments.reduce(
                    (sum, p) => sum + Number(p.amount || 0),
                    0
                );

                const haltingAmount = Number(h.amount || 0);
                const haltingBalance = haltingAmount - haltingPaid;

                return {
                    ...h.toJSON(),

                    haltingAmount,
                    haltingPaid,
                    haltingBalance,

                    haltingPayments: payments.map((p) => ({
                        paymentId: p.id,
                        amount: Number(p.amount),
                        paymentMode: p.paymentMode, // cash / bank
                        paymentType: p.paymentType,
                        paymentDate: p.paymentDate,
                        utrNo: p.utrNo,
                        bankName: p.bankName,
                    })),
                };
            })
        );

        /* ================= SUMMARY ================= */
        const totalHaltingAmount = data.reduce(
            (sum, h) => sum + h.haltingAmount,
            0
        );
        const totalHaltingPaid = data.reduce(
            (sum, h) => sum + h.haltingPaid,
            0
        );

        res.json({
            success: true,
            message: "Halting details fetched successfully",
            pagination: {
                page,
                limit,
                totalRecords: count,
                totalPages: Math.ceil(count / limit),
            },
            summary: {
                totalHaltingAmount,
                totalHaltingPaid,
                totalHaltingBalance: totalHaltingAmount - totalHaltingPaid,
            },
            data,
        });
    } catch (error) {
        console.error("Get All Halting Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


