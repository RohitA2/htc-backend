const db = require("../config/database");
const myServices = require("../services/myServices");
const { Op } = require("sequelize");

exports.getAllPartyLedgerSummary = async (req, res) => {
    try {
        const { search, status = "Active", fromDate, toDate } = req.query;

        /* ✅ Party Filter */
        const partyWhere = {
            status,
            ...(search
                ? { partyName: { [Op.iLike]: `%${search}%` } }
                : {}),
        };

        /* ✅ Booking Date Filter */
        const bookingWhere = {
            isDeleted: false,
            ...(fromDate && toDate
                ? { date: { [Op.between]: [fromDate, toDate] } }
                : {}),
            ...(fromDate && !toDate
                ? { date: { [Op.gte]: fromDate } }
                : {}),
            ...(!fromDate && toDate
                ? { date: { [Op.lte]: toDate } }
                : {}),
        };

        const include = [
            {
                model: db.models.Booking,
                as: "bookings",
                where: bookingWhere,
                required: false,
                include: [
                    {
                        model: db.models.PartyPayments,
                        as: "partyPayments",
                        where: { isDeleted: false },
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

        const result = response.data.map((party) => {
            let totalFreight = 0;
            let totalPaid = 0;

            party.bookings.forEach((booking) => {
                totalFreight += Number(booking.partyFreight || 0);

                booking.partyPayments.forEach((payment) => {
                    totalPaid += Number(payment.amount || 0);
                });
            });

            return {
                partyId: party.id,
                partyName: party.partyName,
                partyPhone: party.partyPhone,
                totalFreight,
                totalPaid,
                balance: totalFreight - totalPaid,
            };
        });

        res.json({
            success: true,
            message: "Data retrieved successfully",
            data: result,
        });
    } catch (error) {
        console.error(error);
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

        /* 🔹 Fetch Bookings */
        const bookingResponse = await myServices.checkAllExist(
            db.models.Booking,
            {
                partyId,
                isDeleted: false,
            }
        );

        const bookings = bookingResponse.success ? bookingResponse.data : [];

        let totalFreight = 0;
        let totalPaid = 0;

        const bookingLedger = [];

        for (const booking of bookings) {
            totalFreight += Number(booking.partyFreight);

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
                        runningBalance: bookingRunningBalance,
                        remarks:p.remarks
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

