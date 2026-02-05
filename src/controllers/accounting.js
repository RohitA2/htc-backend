const db = require("../config/database");
const { Op } = require("sequelize");
exports.getDayBook = async (req, res) => {
  try {
    const { date } = req.query;

    const dayFilter = date
      ? {
        [Op.between]: [
          new Date(`${date} 00:00:00`),
          new Date(`${date} 23:59:59`),
        ],
      }
      : undefined;

    const entries = [];

    /* ===================== BOOKINGS (JOURNAL) ===================== */
    const bookings = await db.models.Booking.findAll({
      where: {
        isDeleted: false,
        ...(dayFilter ? { date: dayFilter } : {}),
      },
      include: [
        { model: db.models.Party, as: "party" },
        { model: db.models.Truck, as: "truck" },
      ],
      order: [["date", "ASC"]],
    });

    bookings.forEach((b) => {
      // Party Debit
      entries.push({
        date: b.date,
        voucherType: "Booking",
        voucherNo: b.id,
        ledger: b.party.partyName,
        particulars: `Booking ${b.fromLocation} → ${b.toLocation}`,
        debit: Number(b.partyFreight),
        credit: 0,
      });

      // Truck Credit
      entries.push({
        date: b.date,
        voucherType: "Booking",
        voucherNo: b.id,
        ledger: b.truck.truckNo,
        particulars: "Truck Freight",
        debit: 0,
        credit: Number(b.truckFreight),
      });

      // Commission / Difference Credit
      if (b.differenceAmount && Number(b.differenceAmount) > 0) {
        entries.push({
          date: b.date,
          voucherType: "Booking",
          voucherNo: b.id,
          ledger: "Commission / Difference",
          particulars: "Booking Difference",
          debit: 0,
          credit: Number(b.differenceAmount),
        });
      }
    });

    /* ===================== PARTY PAYMENTS (RECEIPT) ===================== */
    const partyPayments = await db.models.PartyPayments.findAll({
      where: {
        isDeleted: false,
        ...(dayFilter ? { paymentDate: dayFilter } : {}),
      },
      include: [{ model: db.models.Party, as: "party" }],
      order: [["paymentDate", "ASC"]],
    });

    partyPayments.forEach((p) => {
      // Cash/Bank Debit
      entries.push({
        date: p.paymentDate,
        voucherType: "Receipt",
        voucherNo: p.id,
        ledger: p.paymentMode === "cash" ? "Cash" : p.bankName || "Bank",
        particulars: `Receipt from ${p.party.partyName}`,
        debit: Number(p.amount),
        credit: 0,
      });

      // Party Credit
      entries.push({
        date: p.paymentDate,
        voucherType: "Receipt",
        voucherNo: p.id,
        ledger: p.party.partyName,
        particulars: `Receipt (${p.paymentMode})`,
        debit: 0,
        credit: Number(p.amount),
      });
    });

    /* ===================== TRUCK PAYMENTS (PAYMENT) ===================== */
    const truckPayments = await db.models.TruckPayments.findAll({
      where: {
        isDeleted: false,
        ...(dayFilter ? { paymentDate: dayFilter } : {}),
      },
      include: [{ model: db.models.Truck, as: "truck" }],
      order: [["paymentDate", "ASC"]],
    });

    truckPayments.forEach((p) => {
      // Truck Debit
      entries.push({
        date: p.paymentDate,
        voucherType: "Payment",
        voucherNo: p.id,
        ledger: p.truck.truckNo,
        particulars: "Truck Payment",
        debit: Number(p.amount),
        credit: 0,
      });

      // Cash/Bank Credit
      entries.push({
        date: p.paymentDate,
        voucherType: "Payment",
        voucherNo: p.id,
        ledger: p.paymentMode === "cash" ? "Cash" : p.bankName || "Bank",
        particulars: `Paid to Truck`,
        debit: 0,
        credit: Number(p.amount),
      });
    });

    /* ===================== SORT BY DATE ===================== */
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      date: date || "All",
      data: entries,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



exports.getTrialBalance = async (req, res) => {
  try {
    let rows = [];

    /* PARTY LEDGERS */
    const parties = await db.models.Party.findAll({ where: { status: "Active" } });

    for (const party of parties) {
      const bookings = await db.models.Booking.findAll({
        where: { partyId: party.id, isDeleted: false },
      });
      const payments = await db.models.PartyPayments.findAll({
        where: { partyId: party.id, isDeleted: false },
      });

      const debit = bookings.reduce((s, b) => s + Number(b.partyFreight), 0);
      const credit = payments.reduce((s, p) => s + Number(p.amount), 0);
      const bal = debit - credit;

      if (bal !== 0) {
        rows.push({
          ledger: `Party - ${party.partyName}`,
          debit: bal > 0 ? bal : 0,
          credit: bal < 0 ? Math.abs(bal) : 0,
        });
      }
    }

    /* TRUCK LEDGERS */
    const trucks = await db.models.Truck.findAll({ where: { status: "Active" } });

    for (const truck of trucks) {
      const bookings = await db.models.Booking.findAll({
        where: { truckId: truck.id, isDeleted: false },
      });
      const payments = await db.models.TruckPayments.findAll({
        where: { truckId: truck.id, isDeleted: false },
      });

      const credit = bookings.reduce((s, b) => s + Number(b.truckFreight), 0);
      const debit = payments.reduce((s, p) => s + Number(p.amount), 0);
      const bal = credit - debit;

      if (bal !== 0) {
        rows.push({
          ledger: `Truck - ${truck.truckNo}`,
          debit: bal < 0 ? Math.abs(bal) : 0,
          credit: bal > 0 ? bal : 0,
        });
      }
    }

    /* COMMISSION */
    const commissions = await db.models.Commission.findAll({ where: { isDeleted: false } });
    const commissionTotal = commissions.reduce((s, c) => s + Number(c.amount), 0);

    if (commissionTotal > 0) {
      rows.push({
        ledger: "Commission Income",
        debit: 0,
        credit: commissionTotal,
      });
    }

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



exports.getProfitLoss = async (req, res) => {
  try {
    const bookings = await db.models.Booking.findAll({
      where: { isDeleted: false },
    });

    const commissions = await db.models.Commission.findAll({
      where: { isDeleted: false },
    });

    const income = bookings.reduce(
      (s, b) => s + Number(b.partyFreight),
      0
    ) + commissions.reduce((s, c) => s + Number(c.amount), 0);

    const expense = bookings.reduce(
      (s, b) => s + Number(b.truckFreight),
      0
    );

    const profit = income - expense;

    res.json({
      success: true,
      income,
      expense,
      netProfit: profit,
      result: profit >= 0 ? "PROFIT" : "LOSS",
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
