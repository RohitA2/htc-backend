const db = require("../config/database");
const myServices = require("../services/myServices");
const { Op } = require("sequelize");

exports.getAllTruckLedgerSummary = async (req, res) => {
    try {
        const { search } = req.query;

        const truckWhere = search
            ? { truckNo: { [Op.iLike]: `%${search}%` } }
            : {};

        const include = [
            {
                model: db.models.Booking,
                as: "bookings",
                where: { isDeleted: false },
                required: false,
                include: [
                    {
                        model: db.models.TruckPayments,
                        as: "truckPayments",
                        where: { isDeleted: false },
                        required: false,
                    },
                    {
                        model: db.models.Commission,
                        as: "commissions",
                        where: { isDeleted: false, commissionType: "truck" },
                        required: false,
                    },
                ],
            },
        ];

        const response = await myServices.list(
            db.models.Truck,
            include,
            truckWhere
        );

        if (!response.success) {
            return res.status(400).json(response);
        }

        const data = response.data.map((truck) => {
            let totalFreight = 0;
            let totalPaid = 0;
            let totalCommission = 0;

            truck.bookings.forEach((booking) => {
                totalFreight += Number(booking.truckFreight || 0);

                booking.truckPayments.forEach((p) => {
                    totalPaid += Number(p.amount || 0);
                });

                booking.commissions.forEach((c) => {
                    totalCommission += Number(c.amount || 0);
                });
            });

            const netPayable = totalFreight - totalCommission;

            return {
                truckId: truck.id,
                truckNo: truck.truckNo,
                driver: truck.driverName,
                totalFreight,
                totalCommission,
                netPayable,
                totalPaid,
                balance: netPayable - totalPaid,
            };
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};



exports.getTruckLedgerDetails = async (req, res) => {
    try {
        const { truckId } = req.params;

        const truckRes = await myServices.read(db.models.Truck, truckId);
        if (!truckRes.success) {
            return res.status(404).json(truckRes);
        }

        const bookings = await db.models.Booking.findAll({
            where: { truckId, isDeleted: false },
            include: [
                {
                    model: db.models.TruckPayments,
                    as: "truckPayments",
                    where: { isDeleted: false },
                    required: false,
                },
                {
                    model: db.models.Commission,
                    as: "commissions",
                    where: { isDeleted: false, commissionType: "truck" },
                    required: false,
                },
            ],
            order: [["date", "ASC"]],
        });

        let totalFreight = 0;
        let totalPaid = 0;
        let totalCommission = 0;

        const ledger = bookings.map((booking) => {
            const freight = Number(booking.truckFreight || 0);

            const commission = booking.commissions.reduce(
                (sum, c) => sum + Number(c.amount || 0),
                0
            );

            const netAmount = freight - commission;

            let runningBalance = netAmount;

            const payments = booking.truckPayments.map((p) => {
                runningBalance -= Number(p.amount || 0);
                totalPaid += Number(p.amount || 0);

                return {
                    paymentId: p.id,
                    date: p.paymentDate,
                    amount: Number(p.amount),
                    mode: p.paymentMode,
                    type: p.paymentType,
                    utrNo: p.utrNo,
                    runningBalance,
                };
            });

            totalFreight += freight;
            totalCommission += commission;

            return {
                bookingId: booking.id,
                date: booking.date,
                route: `${booking.fromLocation} → ${booking.toLocation}`,
                freight,
                commission,
                netAmount,
                paid: netAmount - runningBalance,
                balance: runningBalance,
                payments,
            };
        });

        res.json({
            success: true,
            truck: {
                id: truckRes.data.id,
                truckNo: truckRes.data.truckNo,
                driver: truckRes.data.driverName,
            },
            summary: {
                totalFreight,
                totalCommission,
                netPayable: totalFreight - totalCommission,
                totalPaid,
                balance: totalFreight - totalCommission - totalPaid,
            },
            bookings: ledger,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};



exports.createTruckPartialPayment = async (req, res) => {
    try {
        const {
            truckId,
            bookingId,
            amount,
            paymentMode,
            paymentDate,
            utrNo,
        } = req.body;

        if (!truckId || !bookingId || !amount) {
            return res.status(400).json({
                success: false,
                message: "truckId, bookingId and amount are required",
            });
        }

        const bookingRes = await myServices.checkExist(
            db.models.Booking,
            { id: bookingId, truckId, isDeleted: false }
        );

        if (!bookingRes.success) {
            return res.status(404).json(bookingRes);
        }

        const booking = bookingRes.data;

        const payments = await db.models.TruckPayments.findAll({
            where: { bookingId, isDeleted: false },
        });

        const commissions = await db.models.Commission.findAll({
            where: {
                bookingId,
                isDeleted: false,
                commissionType: "truck",
            },
        });

        const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
        const totalCommission = commissions.reduce(
            (s, c) => s + Number(c.amount),
            0
        );

        const netAmount = Number(booking.truckFreight) - totalCommission;
        const remaining = netAmount - totalPaid;

        if (amount > remaining) {
            return res.status(400).json({
                success: false,
                message: `Payment exceeds remaining balance (${remaining})`,
            });
        }

        const paymentRes = await myServices.create(
            db.models.TruckPayments,
            {
                truckId,
                bookingId,
                amount,
                paymentMode,
                paymentType: "Debit",
                paymentDate,
                utrNo,
            }
        );

        res.json({
            success: true,
            message: "Truck payment added successfully",
            data: {
                bookingId,
                paidNow: amount,
                totalPaid: totalPaid + Number(amount),
                balance: remaining - Number(amount),
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
