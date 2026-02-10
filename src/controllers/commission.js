const { Op } = require("sequelize");
const db = require("../config/database");

exports.getCommissionLedger = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;

        const dateFilter =
            fromDate && toDate
                ? { [Op.between]: [fromDate, toDate] }
                : undefined;

        const ledgerEntries = [];
        let totalDifferenceIncome = 0;
        let totalCommissionIncome = 0;

        /* ================= DIFFERENCE INCOME (FROM BOOKINGS) ================= */
        const bookings = await db.models.Booking.findAll({
            where: {
                isDeleted: false,
                ...(dateFilter ? { date: dateFilter } : {}),
            },
            include: [
                { model: db.models.Party, as: "party" },
                { model: db.models.Truck, as: "truck" },
            ],
            order: [["date", "ASC"]],
        });

        for (const b of bookings) {
            const diff =
                Number(b.partyFreight) - Number(b.truckFreight);

            if (diff > 0) {
                totalDifferenceIncome += diff;

                ledgerEntries.push({
                    date: b.date,
                    voucherType: "Journal",
                    voucherNo: `BK-${b.id}`,
                    particulars: `Difference (${b.party.partyName} → ${b.truck.truckNo})`,
                    debit: 0,
                    credit: diff,
                    source: "Difference Income",
                });
            }
        }

        /* ================= TRUCK COMMISSION (FROM COMMISSION TABLE) ================= */
        const commissions = await db.models.Commission.findAll({
            where: {
                isDeleted: false,
                commissionType: "truck",
                ...(dateFilter ? { paymentDate: dateFilter } : {}),
            },
            include: [
                {
                    model: db.models.Booking,
                    include: [{ model: db.models.Truck, as: "truck" }],
                },
            ],
            order: [["paymentDate", "ASC"]],
        });
        console.log("i am from commission", commissions, commissions.booking);
        for (const c of commissions) {
            totalCommissionIncome += Number(c.amount);

            ledgerEntries.push({
                date: c.paymentDate,
                voucherType: "Receipt",
                voucherNo: `CM-${c.id}`,
                particulars: `Commission from Truck ${c.booking?.truck?.truckNo || ""}`,
                debit: 0,
                credit: Number(c.amount),
                source: "Truck Commission",
            });
        }

        /* ================= SORT BY DATE ================= */
        ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

        const totalIncome =
            totalDifferenceIncome + totalCommissionIncome;

        res.json({
            success: true,
            summary: {
                differenceIncome: totalDifferenceIncome,
                commissionIncome: totalCommissionIncome,
                totalIncome,
            },
            ledger: ledgerEntries,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
