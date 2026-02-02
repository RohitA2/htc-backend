const db = require("../config/database");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const moment = require("moment");

exports.createFullBooking = async (payload, userId) => {
    return await sequelize.transaction(async (t) => {

        /* ===================== 1️⃣ PARTY VALIDATION ===================== */
        const party = await db.models.Party.findByPk(payload.partyId, { transaction: t });
        if (!party) throw new Error("Invalid Party ID");

        /* ===================== 2️⃣ TRUCK ===================== */
        let truck = await db.models.Truck.findOne({
            where: { truckNo: payload.truckNo },
            transaction: t,
        });

        if (!truck) {
            truck = await db.models.Truck.create({
                truckNo: payload.truckNo,
                tyreCount: payload.tyreCount,
                driverName: payload.driverName,
                driverPhone: payload.driverPhone,
                transporterName: payload.transporterName,
                transporterPhone: payload.transporterPhone,
            }, { transaction: t });
        }

        /* ===================== 3️⃣ BOOKING ===================== */
        const booking = await db.models.Booking.create({
            date: payload.date,
            bookingType: payload.bookingType,
            commodity: payload.commodity,
            fromLocation: payload.fromLocation,
            toLocation: payload.toLocation,
            rate: payload.rate,
            truckRate: payload.truckRate,
            weight: payload.weight,
            weightType: payload.weightType,
            partyFreight: payload.partyFreight,
            truckFreight: payload.truckFreight,
            partyId: payload.partyId,
            truckId: truck.id,
            companyId: payload.companyId,
            differenceAmount: payload.differenceAmount,
            updateBy: userId,
        }, { transaction: t });

        /* ===================== 4️⃣ PARTY PAYMENT (CREDIT) ===================== */
        if (payload.initialPaymentFromParty > 0) {
            const isBank = payload.partyPaymentMode === "bank";

            if (isBank && (!payload.partyBankAccountNo || !payload.partyUtrNo)) {
                throw new Error("Party bank details required for bank payment");
            }

            await db.models.PartyPayments.create({
                bookingId: booking.id,
                partyId: payload.partyId,
                amount: payload.initialPaymentFromParty,
                paymentMode: payload.partyPaymentMode || "cash",
                paymentDate: isBank ? payload.partyPaymentDate : payload.date,
                bankAccountNo: isBank ? payload.partyBankAccountNo : null,
                utrNo: isBank ? payload.partyUtrNo : null,
                paymentType: "Credit",
                remark: "Advance",
            }, { transaction: t });
        }

        /* ===================== 5️⃣ TRUCK PAYMENT (DEBIT) ===================== */
        if (payload.initialPaymentToTruck > 0) {
            const isBank = payload.truckPaymentMode === "bank";

            if (isBank && (!payload.truckBankAccountNo || !payload.truckUtrNo)) {
                throw new Error("Truck bank details required for bank payment");
            }

            await db.models.TruckPayments.create({
                bookingId: booking.id,
                truckId: truck.id,
                amount: payload.initialPaymentToTruck,
                paymentMode: payload.truckPaymentMode || "cash",
                paymentDate: isBank ? payload.truckPaymentDate : payload.date,
                bankAccountNo: isBank ? payload.truckBankAccountNo : null,
                utrNo: isBank ? payload.truckUtrNo : null,
                paymentType: "Debit",
                remark: "Advance",
            }, { transaction: t });
        }

        /* ===================== 6️⃣ COMMISSION (INCOME) ===================== */
        if (payload.commissionAmount > 0) {
            const isBank = payload.commissionPaymentMode === "bank";

            if (isBank && (!payload.commissionBankAccountNo || !payload.commissionUtrNo)) {
                throw new Error("Commission bank details required");
            }

            await db.models.Commission.create({
                bookingId: booking.id,
                amount: payload.commissionAmount,
                commissionType: payload.commissionType,
                paymentMode: payload.commissionPaymentMode,
                paymentType: payload.commissionPaymentType || "Credit",
                bankAccountNo: isBank ? payload.commissionBankAccountNo : null,
                utrNo: isBank ? payload.commissionUtrNo : null,
                paymentDate: isBank ? payload.commissionGivenDate : payload.date,
                remark: payload.commissionRemark || "Commission",
            }, { transaction: t });
        }

        return booking;
    });
};





/* 🛠 SAFE DATE PARSER (DD/MM/YYYY → JS Date) */
const parseDate = (dateStr) => {
    if (!dateStr) return null;

    const m = moment(dateStr, "DD/MM/YYYY", true);
    return m.isValid() ? m.startOf("day").toDate() : null;
};

exports.getBookings = async (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = {
        isDeleted: false,
    };

    /* 📌 STATUS FILTER */
    if (query.status && query.status !== "all") {
        where.status = query.status;
    }

    /* 🔍 SEARCH (ALIAS-SAFE) */
    if (query.search && query.search.trim()) {
        const search = `%${query.search.trim()}%`;

        where[Op.or] = [
            { commodity: { [Op.iLike]: search } },
            { fromLocation: { [Op.iLike]: search } },
            { toLocation: { [Op.iLike]: search } },

            // Party search
            { "$party.partyName$": { [Op.iLike]: search } },
            { "$party.partyPhone$": { [Op.iLike]: search } },

            // Truck search
            { "$truck.truckNo$": { [Op.iLike]: search } },
            { "$truck.driverName$": { [Op.iLike]: search } },
            { "$truck.driverPhone$": { [Op.iLike]: search } },
        ];
    }

    /* 📅 DATE FILTER (WARNING-FREE) */
    const fromDate = parseDate(query.fromDate);
    const toDate = parseDate(query.toDate);

    if (fromDate && toDate) {
        where.date = {
            [Op.between]: [fromDate, toDate],
        };
    } else if (fromDate) {
        where.date = { [Op.gte]: fromDate };
    } else if (toDate) {
        where.date = { [Op.lte]: toDate };
    }

    /* 🎯 OPTIONAL FILTERS */
    if (query.companyId) where.companyId = query.companyId;
    if (query.partyId) where.partyId = query.partyId;
    if (query.truckId) where.truckId = query.truckId;

    /* 📦 MAIN QUERY */
    const { rows, count } = await db.models.Booking.findAndCountAll({
        where,
        limit,
        offset,
        order: [["date", "DESC"]],
        distinct: true,
        subQuery: false, // 🔥 REQUIRED for alias search

        include: [
            {
                model: db.models.Company,
                as: "company",
                attributes: ["id", "companyName"],
                include: [
                    {
                        model: db.models.Bank,
                        as: "banks",
                        attributes: [
                            "id",
                            "accountNo",
                            "acHolderName",
                            "branchName",
                            "IFSCode",
                        ],
                    },
                ],
            },
            {
                model: db.models.Party,
                as: "party",
                attributes: ["id", "partyName", "partyPhone"],
                required: false,
            },
            {
                model: db.models.Truck,
                as: "truck",
                attributes: ["id", "truckNo", "driverName", "driverPhone"],
                required: false,
            },
            {
                model: db.models.PartyPayments,
                as: "partyPayments",
            },
            {
                model: db.models.TruckPayments,
                as: "truckPayments",
            },
            {
                model: db.models.Commission,
                as: "commissions",
            },
            {
                model: db.models.User,
                as: "updatedByUser",
                attributes: ["id", "fullName", "email"],
            },
        ],
    });

    return {
        data: rows,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    };
};



exports.getBookingById = async (id) => {
    const booking = await db.models.Booking.findByPk(id, {
        include: [
            {
                model: db.models.Company,
                as: "company",
                attributes: ["id", "companyName"],
                include: [
                    {
                        model: db.models.Bank,
                        as: "banks",
                        attributes: ["id", "accountNo", "acHolderName", "branchName", "IFSCode"],
                    },
                ],
            },
            {
                model: db.models.Party,
                attributes: ["id", "partyName", "partyPhone"],
            },
            {
                model: db.models.Truck,
                attributes: ["id", "truckNo", "driverName", "driverPhone"],
            },
            {
                model: db.models.PartyPayments,
                as: "partyPayments",
            },
            {
                model: db.models.TruckPayments,
                as: "truckPayments",
            },
            {
                model: db.models.Commission,
                as: "commissions",
            },
            {
                model: db.models.User,
                as: "updatedByUser",
                attributes: ["id", "fullName", "email"],
            },
        ],
    });

    if (!booking) {
        throw new Error("Booking not found");
    }

    return booking;
};



exports.updateFullBooking = async (bookingId, payload, userId) => {
    return sequelize.transaction(async (t) => {

        const booking = await db.models.Booking.findByPk(bookingId, { transaction: t });
        if (!booking) throw new Error("Booking not found");

        /* ===================== 1️⃣ TRUCK (UPSERT) ===================== */
        let truck = await db.models.Truck.findOne({
            where: { truckNo: payload.truckNo },
            transaction: t,
        });

        if (!truck) {
            truck = await db.models.Truck.create({
                truckNo: payload.truckNo,
                tyreCount: payload.tyreCount,
                driverName: payload.driverName,
                driverPhone: payload.driverPhone,
                transporterName: payload.transporterName,
                transporterPhone: payload.transporterPhone,
            }, { transaction: t });
        }

        /* ===================== 2️⃣ UPDATE BOOKING ===================== */
        await booking.update({
            date: payload.date,
            bookingType: payload.bookingType,
            commodity: payload.commodity,
            fromLocation: payload.fromLocation,
            toLocation: payload.toLocation,
            rate: payload.rate,
            truckRate: payload.truckRate,
            weight: payload.weight,
            weightType: payload.weightType,
            partyFreight: payload.partyFreight,
            truckFreight: payload.truckFreight,
            partyId: payload.partyId,
            truckId: truck.id,
            companyId: payload.companyId,
            differenceAmount: payload.differenceAmount,
            updateBy: userId,
        }, { transaction: t });

        /* ===================== 3️⃣ RESET PAYMENTS ===================== */
        await db.models.PartyPayments.destroy({
            where: { bookingId },
            transaction: t,
        });

        await db.models.TruckPayments.destroy({
            where: { bookingId },
            transaction: t,
        });

        await db.models.Commission.destroy({
            where: { bookingId },
            transaction: t,
        });

        /* ===================== 4️⃣ PARTY PAYMENT ===================== */
        if (payload.initialPaymentFromParty > 0) {
            await db.models.PartyPayments.create({
                bookingId,
                partyId: payload.partyId,
                amount: payload.initialPaymentFromParty,
                paymentMode: payload.partyPaymentMode || "cash",
                paymentDate: payload.partyPaymentDate || payload.date,
                bankAccountNo: payload.partyBankAccountNo || null,
                utrNo: payload.partyUtrNo || null,
                paymentType: "Credit",
                remark: "Advance",
            }, { transaction: t });
        }

        /* ===================== 5️⃣ TRUCK PAYMENT ===================== */
        if (payload.initialPaymentToTruck > 0) {
            await db.models.TruckPayments.create({
                bookingId,
                truckId: truck.id,
                amount: payload.initialPaymentToTruck,
                paymentMode: payload.truckPaymentMode || "cash",
                paymentDate: payload.truckPaymentDate || payload.date,
                bankAccountNo: payload.truckBankAccountNo || null,
                utrNo: payload.truckUtrNo || null,
                paymentType: "Debit",
                remark: "Advance",
            }, { transaction: t });
        }

        /* ===================== 6️⃣ COMMISSION ===================== */
        if (payload.commissionAmount > 0) {
            await db.models.Commission.create({
                bookingId,
                amount: payload.commissionAmount,
                commissionType: payload.commissionType,
                paymentMode: payload.commissionPaymentMode,
                paymentType: payload.commissionPaymentType || "Credit",
                bankAccountNo: payload.commissionBankAccountNo || null,
                utrNo: payload.commissionUtrNo || null,
                paymentDate: payload.commissionGivenDate || payload.date,
                remark: payload.commissionRemark || "Commission",
            }, { transaction: t });
        }

        return booking;
    });
};



exports.softDeleteBooking = async (bookingId, userId) => {
    return sequelize.transaction(async (t) => {

        const booking = await db.models.Booking.findOne({
            where: { id: bookingId, isDeleted: false },
            transaction: t,
        });

        if (!booking) {
            throw new Error("Booking not found or already deleted");
        }

        const deletePayload = {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: userId,
        };

        // Soft delete booking
        await booking.update(deletePayload, { transaction: t });

        // Soft delete related records
        await db.models.PartyPayments.update(deletePayload, {
            where: { bookingId },
            transaction: t,
        });

        await db.models.TruckPayments.update(deletePayload, {
            where: { bookingId },
            transaction: t,
        });

        await db.models.Commission.update(deletePayload, {
            where: { bookingId },
            transaction: t,
        });

        return { message: "Booking soft deleted successfully" };
    });
};
