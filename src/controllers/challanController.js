const db = require("../config/database");
const myServices = require("../services/myServices");
const { Op } = require("sequelize");

/* 📌 CREATE CHALLAN */
exports.createChallan = async (req, res) => {
    try {
        const files = req.files || {};

        const payload = {
            ...req.body,

            registrationCard:
                files.registrationCard?.[0]?.relativePath || null,

            gadiPhoto:
                files.gadiPhoto?.[0]?.relativePath || null,

            insuranceCopy:
                files.insuranceCopy?.[0]?.relativePath || null,

            driverLicence:
                files.driverLicence?.[0]?.relativePath || null,

            driverPhoto:
                files.driverPhoto?.[0]?.relativePath || null,

            aadharCardFile:
                files.aadharCardFile?.[0]?.relativePath || null,

            panCardFile:
                files.panCardFile?.[0]?.relativePath || null,

            tdsCertificate:
                files.tdsCertificate?.[0]?.relativePath || null,

            bankPassbookOrCancelCheque:
                files.bankPassbookOrCancelCheque?.[0]?.relativePath || null,
        };

        const result = await myServices.create(
            db.models.Challan,
            payload
        );

        return res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ success: false, message: error.message });
    }
};


/* 📌 GET BY ID */
exports.getChallanById = async (req, res) => {
    const { id } = req.params;
    const result = await myServices.read(db.models.Challan, id);
    return res.json(result);
};

/* 📌 UPDATE */
exports.updateChallan = async (req, res) => {
    const { id } = req.params;
    const files = req.files || {};

    const payload = {
        ...req.body,

        ...(files.registrationCard && {
            registrationCard: files.registrationCard[0].filename,
        }),
        ...(files.gadiPhoto && { gadiPhoto: files.gadiPhoto[0].filename }),
        ...(files.insuranceCopy && {
            insuranceCopy: files.insuranceCopy[0].filename,
        }),
        ...(files.driverLicence && {
            driverLicence: files.driverLicence[0].filename,
        }),
    };

    const result = await myServices.update(db.models.Challan, id, payload);
    return res.json(result);
};

/* 📌 DELETE (SOFT DELETE) */
exports.deleteChallan = async (req, res) => {
    const { id } = req.params;
    const result = await myServices.updateByWhere(
        db.models.Challan,
        { id },
        { isDeleted: true }
    );
    return res.json(result);
};


/* 📌 LIST WITH PAGINATION */
exports.listChallans = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";

        // Extract filters from query
        const {
            partyId,
            truckNo,
            status,
            fromDate,
            toDate,
        } = req.query;

        // Base condition
        const where = {
            isDeleted: false,
        };

        // 🔍 Global search
        if (search) {
            where[Op.or] = [
                { challanNo: { [Op.iLike]: `%${search}%` } },
                { truckNo: { [Op.iLike]: `%${search}%` } },
                { driverName: { [Op.iLike]: `%${search}%` } },
            ];
        }

        // 🎯 Filters
        if (partyId) where.partyId = partyId;
        if (truckNo) where.truckNo = truckNo;
        if (status) where.status = status;

        // 📅 Date range filter
        if (fromDate && toDate) {
            where.createdAt = {
                [Op.between]: [fromDate, toDate],
            };
        }

        const result = await myServices.listPagination(
            db.models.Challan,
            null, // include if needed later
            page,
            limit,
            where
        );

        return res.json(result);
    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ success: false, message: error.message });
    }
};

