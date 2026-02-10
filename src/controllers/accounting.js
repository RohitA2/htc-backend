const db = require("../config/database");
const { Op } = require("sequelize");

/* =====================================================
   INTERNAL : DAY BOOK DATA (CORE ENGINE)
===================================================== */
const getDayBookData = async (query = {}) => {
  try {
    const { date } = query;

    const dayFilter = date
      ? {
        [Op.between]: [
          new Date(`${date} 00:00:00`),
          new Date(`${date} 23:59:59`),
        ],
      }
      : null;

    const entries = [];

    /* ===================== BOOKINGS ===================== */
    const bookings = await db.models.Booking.findAll({
      where: {
        isDeleted: false,
        ...(dayFilter ? { date: dayFilter } : {}),
      },
      include: [
        { model: db.models.Party, as: "party" },
        { model: db.models.Truck, as: "truck" },
      ],
    });

    for (const b of bookings) {
      // Party Debit
      entries.push({
        date: b.date,
        voucherType: "Journal",
        voucherNo: `BK-${b.id}`,
        ledger: `Party - ${b.party.partyName}`,
        particulars: `${b.fromLocation} → ${b.toLocation}`,
        debit: Number(b.partyFreight),
        credit: 0,
      });

      // Truck Credit
      entries.push({
        date: b.date,
        voucherType: "Journal",
        voucherNo: `BK-${b.id}`,
        ledger: `Truck - ${b.truck.truckNo}`,
        particulars: "Truck Freight",
        debit: 0,
        credit: Number(b.truckFreight),
      });

      // Difference Income
      const diff =
        Number(b.partyFreight) - Number(b.truckFreight);

      if (diff > 0) {
        entries.push({
          date: b.date,
          voucherType: "Journal",
          voucherNo: `BK-${b.id}`,
          ledger: "Difference Income",
          particulars: "Booking Margin",
          debit: 0,
          credit: diff,
        });
      }
    }

    /* ===================== PARTY PAYMENTS ===================== */
    const partyPayments = await db.models.PartyPayments.findAll({
      where: {
        isDeleted: false,
        ...(dayFilter ? { paymentDate: dayFilter } : {}),
      },
      include: [{ model: db.models.Party, as: "party" }],
    });

    for (const p of partyPayments) {
      const cashLedger =
        p.paymentMode === "cash"
          ? "Cash"
          : `Bank - ${p.bankName || "Bank"}`;

      entries.push(
        {
          date: p.paymentDate,
          voucherType: "Receipt",
          voucherNo: `RC-${p.id}`,
          ledger: cashLedger,
          particulars: `From ${p.party.partyName}`,
          debit: Number(p.amount),
          credit: 0,
        },
        {
          date: p.paymentDate,
          voucherType: "Receipt",
          voucherNo: `RC-${p.id}`,
          ledger: `Party - ${p.party.partyName}`,
          particulars: "Payment Received",
          debit: 0,
          credit: Number(p.amount),
        }
      );
    }

    /* ===================== TRUCK PAYMENTS ===================== */
    const truckPayments = await db.models.TruckPayments.findAll({
      where: {
        isDeleted: false,
        ...(dayFilter ? { paymentDate: dayFilter } : {}),
      },
      include: [{ model: db.models.Truck, as: "truck" }],
    });

    for (const p of truckPayments) {
      const cashLedger =
        p.paymentMode === "cash"
          ? "Cash"
          : `Bank - ${p.bankName || "Bank"}`;

      entries.push(
        {
          date: p.paymentDate,
          voucherType: "Payment",
          voucherNo: `PM-${p.id}`,
          ledger: `Truck - ${p.truck.truckNo}`,
          particulars: "Truck Payment",
          debit: Number(p.amount),
          credit: 0,
        },
        {
          date: p.paymentDate,
          voucherType: "Payment",
          voucherNo: `PM-${p.id}`,
          ledger: cashLedger,
          particulars: "Paid to Truck",
          debit: 0,
          credit: Number(p.amount),
        }
      );
    }

    /* ===================== TRUCK COMMISSION ===================== */
    const commissions = await db.models.Commission.findAll({
      where: {
        isDeleted: false,
        commissionType: "truck",
        ...(dayFilter ? { paymentDate: dayFilter } : {}),
      },
      include: [
        {
          model: db.models.Booking,
          include: [
            {
              model: db.models.Truck,
              as: "truck",
            },
          ],
        },
      ],
    });


    for (const c of commissions) {
      const truckNo = c.booking?.truck?.truckNo || "Unknown Truck";

      const cashLedger =
        c.paymentMode === "cash"
          ? "Cash"
          : `Bank - ${c.bankName || "Bank"}`;

      entries.push(
        {
          date: c.paymentDate,
          voucherType: "Receipt",
          voucherNo: `CM-${c.id}`,
          ledger: cashLedger,
          particulars: `Commission from ${truckNo}`,
          debit: Number(c.amount),
          credit: 0,
        },
        {
          date: c.paymentDate,
          voucherType: "Receipt",
          voucherNo: `CM-${c.id}`,
          ledger: "Commission Income",
          particulars: "Truck Commission",
          debit: 0,
          credit: Number(c.amount),
        }
      );
    }


    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    return { success: true, data: entries };
  } catch (e) {
    return { success: false, message: e.message };
  }
};

/* =====================================================
   DAY BOOK API
===================================================== */
exports.getDayBook = async (req, res) => {
  const result = await getDayBookData(req.query);
  if (!result.success) return res.status(500).json(result);
  res.json(result);
};

/* =====================================================
   TRIAL BALANCE
===================================================== */
exports.getTrialBalance = async (req, res) => {
  try {
    const result = await getDayBookData(req.query);
    if (!result.success) return res.status(500).json(result);

    const ledgerMap = {};

    for (const e of result.data) {
      if (!ledgerMap[e.ledger]) {
        ledgerMap[e.ledger] = { debit: 0, credit: 0 };
      }
      ledgerMap[e.ledger].debit += Number(e.debit || 0);
      ledgerMap[e.ledger].credit += Number(e.credit || 0);
    }

    const rows = Object.entries(ledgerMap).map(([ledger, v]) => {
      const bal = v.debit - v.credit;
      return {
        ledger,
        debit: bal > 0 ? bal : 0,
        credit: bal < 0 ? Math.abs(bal) : 0,
      };
    });

    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

    res.json({
      success: true,
      rows,
      totalDebit,
      totalCredit,
      balanced: totalDebit === totalCredit,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* =====================================================
   PROFIT & LOSS
===================================================== */
exports.getProfitLoss = async (req, res) => {
  try {
    const bookings = await db.models.Booking.findAll({
      where: { isDeleted: false },
    });

    const commissions = await db.models.Commission.findAll({
      where: { isDeleted: false },
    });

    const income =
      bookings.reduce(
        (s, b) =>
          s + (Number(b.partyFreight) - Number(b.truckFreight)),
        0
      ) +
      commissions.reduce((s, c) => s + Number(c.amount), 0);

    res.json({
      success: true,
      income,
      expense: 0,
      netProfit: income,
      result: income >= 0 ? "PROFIT" : "LOSS",
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};



exports.getBalanceSheet = async (req, res) => {
  try {
    /* PARTY RECEIVABLE */
    let partyReceivable = 0;
    const parties = await db.models.Party.findAll({ where: { status: "Active" } });

    for (const party of parties) {
      const bookings = await db.models.Booking.findAll({
        where: { partyId: party.id, isDeleted: false },
      });
      const payments = await db.models.PartyPayments.findAll({
        where: { partyId: party.id, isDeleted: false },
      });

      partyReceivable +=
        bookings.reduce((s, b) => s + Number(b.partyFreight), 0) -
        payments.reduce((s, p) => s + Number(p.amount), 0);
    }

    /* TRUCK PAYABLE */
    let truckPayable = 0;
    const trucks = await db.models.Truck.findAll({ where: { status: "Active" } });

    for (const truck of trucks) {
      const bookings = await db.models.Booking.findAll({
        where: { truckId: truck.id, isDeleted: false },
      });
      const payments = await db.models.TruckPayments.findAll({
        where: { truckId: truck.id, isDeleted: false },
      });

      truckPayable +=
        bookings.reduce((s, b) => s + Number(b.truckFreight), 0) -
        payments.reduce((s, p) => s + Number(p.amount), 0);
    }

    /* PROFIT */
    const profitRes = await exports.getProfitLossInternal?.();
    const capital = profitRes?.profit || 0;

    res.json({
      success: true,
      assets: { partyReceivable },
      liabilities: { truckPayable },
      capital,
      balanced: partyReceivable === truckPayable + capital,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
