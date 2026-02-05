const db = require("../config/database");
const myServices = require("../services/myServices");
const { Op } = require("sequelize");

exports.getAllTruckLedgerSummary = async (req, res) => {
    try {
        const { search, fromDate, toDate } = req.query;

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;

        const isNumericSearch = !isNaN(search) && search !== "";

        /* ================= TRUCK FILTER ================= */
        const truckWhere = search
            ? {
                [Op.or]: [
                    { truckNo: { [Op.iLike]: `%${search}%` } },
                    { driverName: { [Op.iLike]: `%${search}%` } },
                    { transporterName: { [Op.iLike]: `%${search}%` } },
                    ...(isNumericSearch ? [{ tyreCount: Number(search) }] : []),
                ],
            }
            : {};

        /* ================= BOOKING DATE FILTER ================= */
        const bookingWhere = {
            isDeleted: false,
            ...(fromDate && toDate && {
                date: { [Op.between]: [fromDate, toDate] },
            }),
            ...(fromDate && !toDate && {
                date: { [Op.gte]: fromDate },
            }),
            ...(!fromDate && toDate && {
                date: { [Op.lte]: toDate },
            }),
        };

        const include = [
            {
                model: db.models.Booking,
                as: "bookings",
                required: false,
                where: bookingWhere,
                include: [
                    {
                        model: db.models.TruckPayments,
                        as: "truckPayments",
                        required: false,
                        where: { isDeleted: false },
                    },
                    {
                        model: db.models.Commission,
                        as: "commissions",
                        required: false,
                        where: { isDeleted: false, commissionType: "truck" },
                    },
                ],
            },
        ];

        const response = await myServices.listPagination(
            db.models.Truck,
            include,
            page,
            limit,
            truckWhere
        );

        if (!response.success) {
            return res.status(400).json(response);
        }

        const data = response.data
            .map((truck) => {
                let totalFreight = 0;
                let totalPaid = 0;
                let totalCommission = 0;

                const bookings = truck.bookings || [];
                if (!bookings.length) return null;

                bookings.forEach((booking) => {
                    totalFreight += Number(booking.truckFreight || 0);
                    booking.truckPayments?.forEach((p) => {
                        totalPaid += Number(p.amount || 0);
                    });
                    booking.commissions?.forEach((c) => {
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
            })
            .filter(Boolean);

        res.json({
            success: true,
            pagination: {
                page,
                limit,
                totalRecords: response.count,
                totalPages: response.totalPages,
            },
            data,
        });
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



exports.getTruckListForLedger = async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;

        const where = {
            status: "Active",
            ...(search
                ? {
                    [Op.or]: [
                        { truckNo: { [Op.iLike]: `%${search}%` } },
                        { driverName: { [Op.iLike]: `%${search}%` } },
                        { transporterName: { [Op.iLike]: `%${search}%` } },
                    ],
                }
                : {}),
        };

        const response = await myServices.listPagination(
            db.models.Truck,
            null,
            page,
            limit,
            where
        );

        if (!response.success) {
            return res.status(400).json(response);
        }

        const data = response.data.map((truck) => ({
            truckId: truck.id,
            truckNo: truck.truckNo,
            driverName: truck.driverName,
            driverPhone: truck.driverPhone,
            transporterName: truck.transporterName,
        }));

        res.json({
            success: true,
            message: "Truck list fetched successfully",
            totalPages: response.totalPages,
            count: response.count,
            data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};




exports.getTruckTallyLedger = async (req, res) => {
    try {
        const { truckId } = req.params;
        const { fromDate, toDate } = req.query;

        /* 🔹 Truck Check */
        const truckRes = await myServices.read(db.models.Truck, truckId);
        if (!truckRes.success) {
            return res.status(404).json(truckRes);
        }

        const ledger = [];

        const dateFilter =
            fromDate && toDate
                ? { [Op.between]: [fromDate, toDate] }
                : fromDate
                    ? { [Op.gte]: fromDate }
                    : toDate
                        ? { [Op.lte]: toDate }
                        : null;

        /* ================= BOOKINGS → CREDIT ================= */
        const bookings = await db.models.Booking.findAll({
            where: {
                truckId,
                isDeleted: false,
                ...(dateFilter ? { date: dateFilter } : {}),
            },
            order: [["date", "ASC"]],
        });

        bookings.forEach((b) => {
            ledger.push({
                date: b.date,
                particulars: `Freight for Booking Ref. #${b.id} (${b.fromLocation} → ${b.toLocation})`,
                voucherType: "Booking",
                voucherNo: b.id,
                debit: 0,
                credit: Number(b.truckFreight),
            });
        });

        /* ================= TRUCK PAYMENTS → DEBIT ================= */
        const payments = await db.models.TruckPayments.findAll({
            where: {
                truckId,
                isDeleted: false,
                ...(dateFilter ? { paymentDate: dateFilter } : {}),
            },
            order: [["paymentDate", "ASC"]],
        });

        payments.forEach((p) => {
            ledger.push({
                date: p.paymentDate,
                particulars: `Payment (${p.paymentMode})`,
                voucherType: "Payment",
                voucherNo: p.id,
                debit: Number(p.amount),
                credit: 0,
            });
        });

        /* ================= COMMISSION → DEBIT ================= */
        const commissions = await db.models.Commission.findAll({
            where: {
                commissionType: "truck",
                isDeleted: false,
            },
            include: [
                {
                    model: db.models.Booking,
                    where: {
                        truckId,
                        ...(dateFilter ? { date: dateFilter } : {}),
                    },
                },
            ],
        });

        commissions.forEach((c) => {
            ledger.push({
                date: c.paymentDate || c.createdAt,
                particulars: `Commission (Booking Ref. #${c.bookingId})`,
                voucherType: "Commission",
                voucherNo: c.id,
                debit: Number(c.amount),
                credit: 0,
            });
        });

        /* ================= SORT & RUNNING BALANCE ================= */
        ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

        let balance = 0;
        const finalLedger = ledger.map((row) => {
            balance -= row.debit;   // truck ledger rule
            balance += row.credit;

            return {
                ...row,
                balance,
                balanceType: balance >= 0 ? "Cr" : "Dr",
            };
        });

        res.json({
            success: true,
            truck: {
                id: truckRes.data.id,
                truckNo: truckRes.data.truckNo,
                driverName: truckRes.data.driverName,
            },
            openingBalance: 0,
            closingBalance: balance,
            ledger: finalLedger,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};