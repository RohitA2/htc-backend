const db = require("../config/database");
const myServices = require("../services/myServices");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database")

// exports.getAllTruckLedgerSummary = async (req, res) => {
//     try {
//         const { search, fromDate, toDate } = req.query;

//         const page = parseInt(req.query.page, 10) || 1;
//         const limit = parseInt(req.query.limit, 10) || 10;

//         const isNumericSearch = !isNaN(search) && search !== "";

//         /* ================= TRUCK FILTER ================= */
//         const truckWhere = search
//             ? {
//                 [Op.or]: [
//                     { truckNo: { [Op.iLike]: `%${search}%` } },
//                     { driverName: { [Op.iLike]: `%${search}%` } },
//                     { transporterName: { [Op.iLike]: `%${search}%` } },
//                     ...(isNumericSearch ? [{ tyreCount: Number(search) }] : []),
//                 ],
//             }
//             : {};

//         /* ================= BOOKING DATE FILTER ================= */
//         const bookingWhere = {
//             isDeleted: false,
//             ...(fromDate && toDate && {
//                 date: { [Op.between]: [fromDate, toDate] },
//             }),
//             ...(fromDate && !toDate && {
//                 date: { [Op.gte]: fromDate },
//             }),
//             ...(!fromDate && toDate && {
//                 date: { [Op.lte]: toDate },
//             }),
//         };

//         const include = [
//             {
//                 model: db.models.Booking,
//                 as: "bookings",
//                 required: false,
//                 where: bookingWhere,
//                 include: [
//                     {
//                         model: db.models.TruckPayments,
//                         as: "truckPayments",
//                         required: false,
//                         where: { isDeleted: false },
//                     },
//                     {
//                         model: db.models.Commission,
//                         as: "commissions",
//                         required: false,
//                         where: { isDeleted: false, commissionType: "truck" },
//                     },
//                 ],
//             },
//         ];

//         const response = await myServices.listPagination(
//             db.models.Truck,
//             include,
//             page,
//             limit,
//             truckWhere
//         );

//         if (!response.success) {
//             return res.status(400).json(response);
//         }

//         const data = response.data
//             .map((truck) => {
//                 let totalFreight = 0;
//                 let totalPaid = 0;
//                 let totalCommission = 0;

//                 const bookings = truck.bookings || [];
//                 if (!bookings.length) return null;

//                 bookings.forEach((booking) => {
//                     totalFreight += Number(booking.truckFreight || 0);
//                     booking.truckPayments?.forEach((p) => {
//                         totalPaid += Number(p.amount || 0);
//                     });
//                     booking.commissions?.forEach((c) => {
//                         totalCommission += Number(c.amount || 0);
//                     });
//                 });

//                 const netPayable = totalFreight;

//                 return {
//                     truckId: truck.id,
//                     truckNo: truck.truckNo,
//                     driver: truck.driverName,
//                     totalFreight,
//                     totalCommission,
//                     netPayable,
//                     totalPaid,
//                     balance: netPayable - totalPaid,
//                 };
//             })
//             .filter(Boolean);

//         res.json({
//             success: true,
//             pagination: {
//                 page,
//                 limit,
//                 totalRecords: response.count,
//                 totalPages: response.totalPages,
//             },
//             data,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

exports.getAllTruckLedgerSummary = async (req, res) => {
    try {
        const { search, fromDate, toDate } = req.query;

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;

        const isNumericSearch = search && !isNaN(search);

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

        /* ================= INCLUDES ================= */
        const include = [
            {
                model: db.models.Booking,
                as: "bookings",
                required: false,
                where: bookingWhere,
                attributes: ["id", "truckFreight"],
                include: [
                    {
                        model: db.models.BookingHalting,
                        as: "haltings", // ✅ MUST MATCH ASSOCIATION
                        required: false,
                        attributes: ["amount"],
                        where: { isDeleted: false },
                    },
                    {
                        model: db.models.TruckPayments,
                        as: "truckPayments",
                        required: false,
                        where: { isDeleted: false },
                        attributes: ["amount", "paymentFor"],
                    },
                    {
                        model: db.models.Commission,
                        as: "commissions",
                        required: false,
                        where: {
                            isDeleted: false,
                            commissionType: "truck",
                        },
                        attributes: ["amount"],
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

        /* ================= CALCULATION ================= */
        const data = response.data
            .map((truck) => {
                const bookings = truck.bookings || [];
                if (!bookings.length) return null;

                let totalFreight = 0;
                let totalHalting = 0;
                let totalFreightPaid = 0;
                let totalHaltingPaid = 0;
                let totalCommission = 0;

                const bookingIds = [];

                bookings.forEach((booking) => {
                    bookingIds.push(booking.id);

                    // Freight
                    totalFreight += Number(booking.truckFreight || 0);

                    // ✅ HALTING (FIXED)
                    booking.haltings?.forEach((h) => {
                        totalHalting += Number(h.amount || 0);
                    });

                    // Payments
                    booking.truckPayments?.forEach((p) => {
                        if (p.paymentFor === "freight") {
                            totalFreightPaid += Number(p.amount || 0);
                        } else if (p.paymentFor === "halting") {
                            totalHaltingPaid += Number(p.amount || 0);
                        }
                    });

                    // Commission (income)
                    booking.commissions?.forEach((c) => {
                        totalCommission += Number(c.amount || 0);
                    });
                });

                const totalPayable = totalFreight + totalHalting;
                const totalPaid = totalFreightPaid + totalHaltingPaid;
                const balance = totalPayable - totalPaid;

                return {
                    truckId: truck.id,
                    truckNo: truck.truckNo,
                    driver: truck.driverName,

                    bookingCount: bookingIds.length,
                    bookingIds,

                    totalFreight,
                    totalHalting,
                    totalCommission,

                    totalFreightPaid,
                    totalHaltingPaid,
                    totalPaid,

                    totalPayable,
                    balance,
                };
            })
            .filter(Boolean);

        /* ================= RESPONSE ================= */
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
        console.error("Truck Ledger Summary Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};





// exports.getTruckLedgerDetails = async (req, res) => {
//     try {
//         const { truckId } = req.params;

//         const truckRes = await myServices.read(db.models.Truck, truckId);
//         if (!truckRes.success) {
//             return res.status(404).json(truckRes);
//         }

//         const bookings = await db.models.Booking.findAll({
//             where: { truckId, isDeleted: false },
//             include: [
//                 {
//                     model: db.models.TruckPayments,
//                     as: "truckPayments",
//                     where: { isDeleted: false },
//                     required: false,
//                 },
//                 {
//                     model: db.models.Commission,
//                     as: "commissions",
//                     where: { isDeleted: false, commissionType: "truck" },
//                     required: false,
//                 },
//             ],
//             order: [["date", "ASC"]],
//         });

//         let totalFreight = 0;
//         let totalPaid = 0;
//         let totalCommission = 0;

//         const ledger = bookings.map((booking) => {
//             const freight = Number(booking.truckFreight || 0);

//             const commission = booking.commissions.reduce(
//                 (sum, c) => sum + Number(c.amount || 0),
//                 0
//             );

//             const netAmount = freight;

//             let runningBalance = netAmount;

//             const payments = booking.truckPayments.map((p) => {
//                 runningBalance -= Number(p.amount || 0);
//                 totalPaid += Number(p.amount || 0);

//                 return {
//                     paymentId: p.id,
//                     date: p.paymentDate,
//                     amount: Number(p.amount),
//                     mode: p.paymentMode,
//                     type: p.paymentType,
//                     utrNo: p.utrNo,
//                     runningBalance,
//                 };
//             });

//             totalFreight += freight;
//             totalCommission += commission;

//             return {
//                 bookingId: booking.id,
//                 date: booking.date,
//                 route: `${booking.fromLocation} → ${booking.toLocation}`,
//                 freight,
//                 commission,
//                 netAmount,
//                 paid: netAmount - runningBalance,
//                 balance: runningBalance,
//                 payments,
//             };
//         });

//         res.json({
//             success: true,
//             truck: {
//                 id: truckRes.data.id,
//                 truckNo: truckRes.data.truckNo,
//                 driver: truckRes.data.driverName,
//             },
//             summary: {
//                 totalFreight,
//                 totalCommission,
//                 netPayable: totalFreight,
//                 totalPaid,
//                 balance: totalFreight - totalPaid,
//             },
//             bookings: ledger,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

exports.createTruckPartialPayment = async (req, res) => {
    try {
        const {
            truckId,
            bookingId,
            amount,
            paymentMode,
            paymentDate,
            utrNo,
            paymentFor,
            bankAcHolderName,
            bankAccountNo,
            bankName,
            ifscCode,
            panNumber,
        } = req.body;

        /* 🔹 Basic Validation */
        if (!truckId || !bookingId || !amount) {
            return res.status(400).json({
                success: false,
                message: "truckId, bookingId and amount are required",
            });
        }

        /* 🔹 Booking Validation */
        const bookingRes = await myServices.checkExist(
            db.models.Booking,
            { id: bookingId, truckId, isDeleted: false }
        );

        if (!bookingRes.success) {
            return res.status(404).json(bookingRes);
        }

        const booking = bookingRes.data;

        /* 🔹 Existing Payments */
        const payments = await db.models.TruckPayments.findAll({
            where: { bookingId, isDeleted: false },
        });

        /* 🔹 Commission (ONLY FOR DISPLAY) */
        const commissions = await db.models.Commission.findAll({
            where: {
                bookingId,
                isDeleted: false,
                commissionType: "truck",
            },
        });

        /* 🔹 Calculations */
        const totalPaid = payments.reduce(
            (sum, p) => sum + Number(p.amount),
            0
        );

        const totalCommission = commissions.reduce(
            (sum, c) => sum + Number(c.amount),
            0
        );

        const halting = Number(booking.haltingAmount || 0);
        const freight = Number(booking.truckFreight || 0);

        // 🚫 Commission NOT deducted
        const grossAmount = freight + halting;
        const remaining = grossAmount - totalPaid;

        /* 🔹 Overpayment Protection */
        if (Number(amount) > remaining) {
            return res.status(400).json({
                success: false,
                message: `Payment exceeds remaining balance (${remaining})`,
            });
        }

        /* 🔹 Create Payment Entry */
        await myServices.create(
            db.models.TruckPayments,
            {
                truckId,
                bookingId,
                amount: Number(amount),
                paymentMode,
                paymentType: "Debit",
                paymentDate,
                utrNo,
                paymentFor,
                bankAcHolderName,
                bankAccountNo,
                bankName,
                ifscCode,
                panNumber,
            },
            { isNewRecord: true }
        );

        /* 🔹 Success Response */
        res.json({
            success: true,
            message: "Truck payment added successfully",
            data: {
                bookingId,
                freight,
                halting,
                grossAmount,
                commission: totalCommission, // 👈 only display
                paidNow: Number(amount),
                totalPaid: totalPaid + Number(amount),
                balance: remaining - Number(amount),
            },
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// exports.createTruckPartialPayment = async (req, res) => {
//     try {
//         const {
//             truckId,
//             bookingId,
//             amount,
//             paymentMode,
//             paymentDate,
//             utrNo,
//             paymentFor,
//             bankAcHolderName,
//             bankAccountNo,
//             bankName,
//             ifscCode,
//             panNumber,
//         } = req.body;

//         if (!truckId || !bookingId || !amount) {
//             return res.status(400).json({
//                 success: false,
//                 message: "truckId, bookingId and amount are required",
//             });
//         }

//         const bookingRes = await myServices.checkExist(
//             db.models.Booking,
//             { id: bookingId, truckId, isDeleted: false }
//         );

//         if (!bookingRes.success) {
//             return res.status(404).json(bookingRes);
//         }

//         const booking = bookingRes.data;

//         const payments = await db.models.TruckPayments.findAll({
//             where: { bookingId, isDeleted: false },
//         });

//         const commissions = await db.models.Commission.findAll({
//             where: {
//                 bookingId,
//                 isDeleted: false,
//                 commissionType: "truck",
//             },
//         });

//         const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
//         const totalCommission = commissions.reduce(
//             (s, c) => s + Number(c.amount),
//             0
//         );

//         console.log("freight amount", booking.truckFreight);

//         console.log(totalPaid, totalCommission);

//         const netAmount = Number(booking.truckFreight) + halting;
//         console.log("netAmount".netAmount);

//         const remaining = netAmount - totalPaid;
//         console.log("remaining", remaining)

//         if (amount > remaining) {
//             return res.status(400).json({
//                 success: false,
//                 message: `Payment exceeds remaining balance (${remaining})`,
//             });
//         }

//         const paymentRes = await myServices.create(
//             db.models.TruckPayments,
//             {
//                 truckId,
//                 bookingId,
//                 amount,
//                 paymentMode,
//                 paymentType: "Debit",
//                 paymentDate,
//                 utrNo,
//                 paymentFor,
//                 bankAcHolderName,
//                 bankAccountNo,
//                 bankName,
//                 ifscCode,
//                 PanNumber: panNumber,
//             },
//             {
//                 isNewRecord: true,
//             }
//         );

//         res.json({
//             success: true,
//             message: "Truck payment added successfully",
//             data: {
//                 bookingId,
//                 paidNow: amount,
//                 totalPaid: totalPaid + Number(amount),
//                 balance: remaining - Number(amount),
//             },
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: error.message });
//     }
// };



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
                    model: db.models.BookingHalting,
                    as: "haltings",
                    where: { isDeleted: false },
                    required: false,
                },
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
        let totalHalting = 0;
        let totalPaid = 0;
        let totalCommission = 0;

        const ledger = bookings.map((booking) => {
            const freight = Number(booking.truckFreight || 0);

            // ✅ Halting sum (multiple rows possible)
            const halting = booking.haltings?.reduce(
                (sum, h) => sum + Number(h.amount || 0),
                0
            ) || 0;

            const commission = booking.commissions?.reduce(
                (sum, c) => sum + Number(c.amount || 0),
                0
            ) || 0;

            const netAmount = freight + halting;

            let runningBalance = netAmount;

            const payments = booking.truckPayments.map((p) => {
                const amount = Number(p.amount || 0);

                runningBalance -= amount;
                totalPaid += amount;

                return {
                    paymentId: p.id,
                    date: p.paymentDate,
                    amount,
                    mode: p.paymentMode,
                    paymentFor: p.paymentFor, // freight / halting
                    type: p.paymentType,
                    utrNo: p.utrNo,
                    runningBalance,
                    bankName: p.bankName,
                    bankBranch: p.bankBranch,
                    Ifsc: p.ifscCode,
                    bankAcHolderName: p.bankAcHolderName,
                    bankAccountNo: p.bankAccountNo,
                    utrNo: p.utrNo,
                    panNumber: p.PanNumber,
                };
            });

            totalFreight += freight;
            totalHalting += halting;
            totalCommission += commission;

            return {
                bookingId: booking.id,
                date: booking.date,
                route: `${booking.fromLocation} → ${booking.toLocation}`,

                freight,
                halting,
                commission,

                netAmount,
                paid: netAmount - runningBalance,
                balance: runningBalance,

                payments,
            };
        });

        const totalPayable = totalFreight + totalHalting;

        res.json({
            success: true,
            truck: {
                id: truckRes.data.id,
                truckNo: truckRes.data.truckNo,
                driver: truckRes.data.driverName,
            },
            summary: {
                totalFreight,
                totalHalting,
                totalCommission,
                totalPayable,
                totalPaid,
                balance: totalPayable - totalPaid,
            },
            bookings: ledger,
        });
    } catch (error) {
        console.error("Truck Ledger Details Error:", error);
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

        /* ================= TRUCK CHECK ================= */
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

        /* ================= BOOKINGS → FREIGHT CREDIT ================= */
        const bookings = await db.models.Booking.findAll({
            where: {
                truckId,
                isDeleted: false,
                ...(dateFilter ? { date: dateFilter } : {}),
            },
            attributes: ["id", "date", "fromLocation", "toLocation", "truckFreight"],
            order: [["date", "ASC"]],
        });

        bookings.forEach((b) => {
            ledger.push({
                date: b.date,
                particulars: `Freight for Booking #${b.id} (${b.fromLocation} → ${b.toLocation})`,
                voucherType: "Booking",
                voucherNo: b.id,
                debit: 0,
                credit: Number(b.truckFreight),
                commission: 0,
            });
        });

        /* ================= HALTING → CREDIT ================= */
        const haltings = await db.models.BookingHalting.findAll({
            where: {
                truckId,
                isDeleted: false,
                ...(dateFilter ? { haltingDate: dateFilter } : {}),
            },
            order: [["haltingDate", "ASC"]],
        });

        haltings.forEach((h) => {
            ledger.push({
                date: h.haltingDate,
                particulars: `Halting Charges (Booking #${h.bookingId})`,
                voucherType: "Halting",
                voucherNo: h.id,
                debit: 0,
                credit: Number(h.amount),
                commission: 0,
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
                particulars: `Payment (${p.paymentFor || "freight"} | ${p.paymentMode})`,
                voucherType: "Payment",
                voucherNo: p.id,
                debit: Number(p.amount),
                credit: 0,
                commission: 0,
            });
        });

        /* ================= COMMISSION (DISPLAY ONLY) ================= */
        const commissions = await db.models.Commission.findAll({
            where: {
                commissionType: "truck",
                isDeleted: false,
                ...(dateFilter ? { paymentDate: dateFilter } : {}),
            },
            order: [["paymentDate", "ASC"]],
        });

        commissions.forEach((c) => {
            ledger.push({
                date: c.paymentDate || c.createdAt,
                particulars: `Commission Received (Booking #${c.bookingId})`,
                voucherType: "Commission",
                voucherNo: c.id,
                debit: 0,
                credit: 0, // ❌ no balance impact
                commission: Number(c.amount), // 👀 informational
            });
        });

        /* ================= SORT & RUNNING BALANCE ================= */
        ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

        let balance = 0;

        const finalLedger = ledger.map((row) => {
            balance = balance + row.credit - row.debit;

            return {
                ...row,
                balance: Math.abs(balance),
                balanceType: balance >= 0 ? "Cr" : "Dr",
            };
        });

        /* ================= RESPONSE ================= */
        res.json({
            success: true,
            truck: {
                id: truckRes.data.id,
                truckNo: truckRes.data.truckNo,
                driverName: truckRes.data.driverName,
            },
            openingBalance: 0,
            closingBalance: Math.abs(balance),
            closingBalanceType: balance >= 0 ? "Cr" : "Dr",
            ledger: finalLedger,
        });
    } catch (error) {
        console.error("Truck Tally Ledger Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



exports.createTruckBulkPayment = async (req, res) => {
    const {
        truckId,
        amount,
        paymentMode,
        paymentDate,
        remark,
        bankAcHolderName,
        bankAccountNo,
        bankName,
        ifscCode,
        panNumber,
        utrNo,
    } = req.body;

    const t = await sequelize.transaction();

    try {
        let remainingAmount = Number(amount);

        const bookings = await db.models.Booking.findAll({
            where: { truckId },
            order: [["date", "ASC"]],
            transaction: t,
        });

        for (const booking of bookings) {
            if (remainingAmount <= 0) break;

            const paid = await db.models.TruckPayments.sum("amount", {
                where: { bookingId: booking.id },
                transaction: t,
            });

            const balance =
                Number(booking.truckFreight) -
                Number(paid || 0);

            if (balance <= 0) continue;

            const payNow = Math.min(balance, remainingAmount);

            await db.models.TruckPayments.create(
                {
                    bookingId: booking.id,
                    truckId,
                    amount: payNow,
                    paymentMode,
                    paymentDate,
                    paymentType: "Debit",
                    remark: remark || "Bulk Truck Payment",
                    bankAcHolderName,
                    bankAccountNo,
                    bankName,
                    ifscCode,
                    utrNo: utrNo,
                    PanNumber: panNumber,
                },
                { transaction: t }
            );

            await booking.update(
                {
                    truckPaymentStatus:
                        balance - payNow === 0
                            ? "Completed"
                            : "Partial",
                },
                { transaction: t }
            );

            remainingAmount -= payNow;
        }

        await t.commit();

        res.json({
            success: true,
            message: "Truck bulk payment done",
        });
    } catch (error) {
        await t.rollback();
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
