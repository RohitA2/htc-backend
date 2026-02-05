const db = require("../config/database");
const myServices = require("../services/myServices");
const { Op } = require("sequelize");

exports.getAllPartyLedgerSummary = async (req, res) => {
    try {
        const { search, status = "Active", fromDate, toDate } = req.query;

        /* ================= PARTY FILTER (ONLY STATUS) ================= */
        const partyWhere = {
            status,
        };

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

        /* ================= INCLUDE ================= */
        const include = [
            {
                model: db.models.Booking,
                as: "bookings",
                required: false,
                where: bookingWhere,
                include: [
                    {
                        model: db.models.PartyPayments,
                        as: "partyPayments",
                        required: false,
                        where: { isDeleted: false },
                    },
                    {
                        model: db.models.Truck,
                        as: "truck",
                        required: false,
                    },
                ],
            },
        ];

        const response = await myServices.list(
            db.models.Party,
            include,
            partyWhere
        );

        if (!response.success) {
            return res.status(400).json(response);
        }

        /* ================= DATA TRANSFORMATION ================= */
        const result = response.data
            .map((party) => {
                let totalFreight = 0;
                let totalPaid = 0;

                let bookings = party.bookings || [];

                /* ================= SEARCH FILTER ================= */
                if (search) {
                    const searchText = search.toLowerCase();

                    bookings = bookings.filter((b) =>
                        party.partyName?.toLowerCase().includes(searchText) ||
                        party.partyPhone?.includes(searchText) ||
                        b.truck?.truckNo?.toLowerCase().includes(searchText)
                    );
                }

                if (!bookings.length) return null;

                bookings = bookings.map((booking) => {
                    const freight = Number(booking.partyFreight || 0);

                    totalFreight += freight;

                    booking.partyPayments?.forEach((p) => {
                        totalPaid += Number(p.amount || 0);
                    });

                    return {
                        bookingId: booking.id,
                        date: booking.date,
                        freight,
                        paid: booking.partyPayments?.reduce(
                            (sum, p) => sum + Number(p.amount || 0),
                            0
                        ),
                        balance:
                            freight -
                            booking.partyPayments?.reduce(
                                (sum, p) => sum + Number(p.amount || 0),
                                0
                            ),
                        truck: booking.truck
                            ? {
                                truckId: booking.truck.id,
                                truckNo: booking.truck.truckNo,
                                driverName: booking.truck.driverName,
                            }
                            : null,
                    };
                });

                return {
                    partyId: party.id,
                    partyName: party.partyName,
                    partyPhone: party.partyPhone,
                    totalFreight,
                    totalPaid,
                    balance: totalFreight - totalPaid,
                    bookings,
                };
            })
            .filter(Boolean);

        res.json({
            success: true,
            message: "Party ledger summary fetched successfully",
            data: result,
        });
    } catch (error) {
        console.error("Party Ledger Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};




exports.getPartyLedgerDetails = async (req, res) => {
    try {
        const { partyId } = req.params;

        /* 🔹 Fetch Party */
        const partyResponse = await myServices.read(
            db.models.Party,
            partyId
        );

        if (!partyResponse.success) {
            return res.status(404).json(partyResponse);
        }

        /* 🔹 Fetch Bookings WITH TRUCK */
        const bookings = await db.models.Booking.findAll({
            where: {
                partyId,
                isDeleted: false,
            },
            include: [
                {
                    model: db.models.Truck,
                    as: "truck",
                    required: false,
                },
            ],
            order: [["date", "ASC"]],
        });

        let totalFreight = 0;
        let totalPaid = 0;

        const bookingLedger = [];

        for (const booking of bookings) {
            totalFreight += Number(booking.partyFreight);

            /* 🔹 Fetch Payments */
            const paymentsResponse = await myServices.checkAllExist(
                db.models.PartyPayments,
                {
                    bookingId: booking.id,
                    isDeleted: false,
                }
            );

            let bookingRunningBalance = Number(booking.partyFreight);
            const payments = [];

            if (paymentsResponse.success) {
                for (const p of paymentsResponse.data) {
                    bookingRunningBalance -= Number(p.amount);
                    totalPaid += Number(p.amount);

                    payments.push({
                        paymentId: p.id,
                        date: p.paymentDate,
                        amount: Number(p.amount),
                        mode: p.paymentMode,
                        type: p.paymentType,
                        utrNo: p.utrNo,
                        remarks: p.remarks,
                        runningBalance: bookingRunningBalance,
                    });
                }
            }

            bookingLedger.push({
                bookingId: booking.id,
                bookingDate: booking.date,
                companyId: booking.companyId,
                from: booking.fromLocation,
                to: booking.toLocation,
                freight: Number(booking.partyFreight),
                paid: Number(booking.partyFreight) - bookingRunningBalance,
                balance: bookingRunningBalance,

                /* 🚛 TRUCK DETAILS ADDED */
                truck: booking.truck
                    ? {
                        truckId: booking.truck.id,
                        truckNo: booking.truck.truckNo,
                        driverName: booking.truck.driverName,
                        driverPhone: booking.truck.driverPhone,
                        transporterName: booking.truck.transporterName,
                    }
                    : null,

                payments,
            });
        }

        res.json({
            success: true,
            party: {
                id: partyResponse.data.id,
                name: partyResponse.data.partyName,
                phone: partyResponse.data.partyPhone,
            },
            summary: {
                totalFreight,
                totalPaid,
                balance: totalFreight - totalPaid,
            },
            bookings: bookingLedger,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



exports.createPartyPartialPayment = async (req, res) => {
    try {
        const {
            partyId,
            bookingId,
            amount,
            paymentMode,
            paymentType = "Credit",
            paymentDate,
            utrNo,
            remarks,
            bankId
        } = req.body;

        if (!partyId || !bookingId || !amount) {
            return res.status(400).json({
                success: false,
                message: "partyId, bookingId and amount are required",
            });
        }

        /* 🔹 Validate Booking */
        const bookingResp = await myServices.read(
            db.models.Booking,
            bookingId,
            null,
            { partyId, isDeleted: false }
        );

        if (!bookingResp.success) {
            return res.status(404).json(bookingResp);
        }

        const booking = bookingResp.data;

        /* 🔹 Calculate already paid amount */
        const paymentsResp = await myServices.checkAllExist(
            db.models.PartyPayments,
            {
                bookingId,
                isDeleted: false,
            }
        );

        const totalPaid = paymentsResp.success
            ? paymentsResp.data.reduce(
                (sum, p) => sum + Number(p.amount),
                0
            )
            : 0;

        const remainingBalance =
            Number(booking.partyFreight) - totalPaid;

        /* 🔥 Over-payment protection */
        if (amount > remainingBalance) {
            return res.status(400).json({
                success: false,
                message: `Payment exceeds remaining balance. Remaining: ${remainingBalance}`,
            });
        }

        /* 🔹 Create payment */
        const paymentData = {
            partyId,
            bookingId,
            amount,
            paymentMode,
            paymentType,
            paymentDate,
            utrNo,
            remarks,
            bankId,
            isDeleted: false,
        };

        const paymentResp = await myServices.create(
            db.models.PartyPayments,
            paymentData
        );

        if (!paymentResp.success) {
            return res.status(400).json(paymentResp);
        }

        /* 🔹 Update booking status if fully paid */
        if (amount === remainingBalance) {
            await myServices.update(db.models.Booking, bookingId, {
                paymentStatus: "PAID",
            });
        }

        res.json({
            success: true,
            message: "Payment recorded successfully",
            data: {
                bookingId,
                paidNow: amount,
                totalPaid: totalPaid + Number(amount),
                balance: remainingBalance - Number(amount),
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



exports.getPartyTallyLedger = async (req, res) => {
    try {
        const { partyId } = req.params;
        const { fromDate, toDate } = req.query;

        /* PARTY CHECK */
        const partyRes = await myServices.read(db.models.Party, partyId);
        if (!partyRes.success) {
            return res.status(404).json(partyRes);
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

        /* ================= BOOKINGS → DEBIT ================= */
        const bookings = await db.models.Booking.findAll({
            where: {
                partyId,
                isDeleted: false,
                ...(dateFilter ? { date: dateFilter } : {}),
            },
            include: [{ model: db.models.Truck, as: "truck" }],
            order: [["date", "ASC"]],
        });

        bookings.forEach((b) => {
            ledger.push({
                date: b.date,
                particulars: `Booking ${b.fromLocation} → ${b.toLocation}${b.truck ? ` (${b.truck.truckNo})` : ""
                    }`,
                voucherType: "Booking",
                voucherNo: b.id,
                debit: Number(b.partyFreight),
                credit: 0,
            });
        });

        /* ================= PAYMENTS → CREDIT ================= */
        const payments = await db.models.PartyPayments.findAll({
            where: {
                partyId,
                isDeleted: false,
                ...(dateFilter ? { paymentDate: dateFilter } : {}),
            },
            order: [["paymentDate", "ASC"]],
        });

        payments.forEach((p) => {
            ledger.push({
                date: p.paymentDate,
                particulars: `Receipt (${p.paymentMode})`,
                voucherType: "Receipt",
                voucherNo: p.id,
                debit: 0,
                credit: Number(p.amount),
            });
        });

        /* ================= SORT & RUNNING BALANCE ================= */
        ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

        let balance = 0;
        const finalLedger = ledger.map((row) => {
            balance += row.debit;
            balance -= row.credit;

            return {
                ...row,
                balance,
                balanceType: balance >= 0 ? "Dr" : "Cr",
            };
        });

        res.json({
            success: true,
            party: {
                id: partyRes.data.id,
                name: partyRes.data.partyName,
            },
            openingBalance: 0,
            closingBalance: balance,
            ledger: finalLedger,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};




exports.getPartyListForLedger = async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;

        const where = {
            status: "Active",
            ...(search
                ? {
                    [Op.or]: [
                        { partyName: { [Op.iLike]: `%${search}%` } },
                        { partyPhone: { [Op.iLike]: `%${search}%` } },
                    ],
                }
                : {}),
        };

        const response = await myServices.listPagination(
            db.models.Party,
            null,
            page,
            limit,
            where
        );

        if (!response.success) {
            return res.status(400).json(response);
        }

        const data = response.data.map((party) => ({
            partyId: party.id,
            partyName: party.partyName,
            partyPhone: party.partyPhone,
        }));

        res.json({
            success: true,
            message: "Party list fetched successfully",
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





