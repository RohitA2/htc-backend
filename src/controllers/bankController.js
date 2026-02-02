const db = require("../config/database");
const myServices = require("../services/myServices");
const { Op } = require("sequelize");
/**
 * Create Bank
 */
exports.createBank = async (req, res) => {
    try {
        const { isPrimary, companyId } = req.body;

        // 🔥 Ensure only one primary bank per company
        if (isPrimary) {
            await db.models.Bank.update(
                { isPrimary: false },
                { where: { companyId } }
            );
        }

        const response = await myServices.create(db.models.Bank, req.body);
        return res.status(response.success ? 201 : 400).json(response);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get Bank by ID
 */
exports.getBankById = async (req, res) => {
    try {
        const response = await myServices.read(db.models.Bank, req.params.id);
        return res.status(response.success ? 200 : 404).json(response);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get All Banks (optional company filter)
 */
exports.getAllBanks = async (req, res) => {
    try {
        const { companyId, status } = req.query;

        const where = {};
        if (companyId) where.companyId = companyId;
        if (status) where.status = status;

        const response = await myServices.list(db.models.Bank, null, where, 100, 0);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Paginated Banks
 */
exports.getBanksPagination = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            companyId,
            status,
            search
        } = req.query;

        const where = {};

        if (companyId) where.companyId = companyId;
        if (status) where.status = status;

        // 🔍 Search support
        if (search) {
            where[Op.or] = [
                { acHolderName: { [Op.iLike]: `%${search}%` } },
                { accountNo: { [Op.iLike]: `%${search}%` } },
                { branchName: { [Op.iLike]: `%${search}%` } },
                { IFSCode: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const response = await myServices.listPagination(
            db.models.Bank,
            null,
            parseInt(page),
            parseInt(limit),
            where
        );

        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Update Bank
 */
exports.updateBank = async (req, res) => {
    try {
        const { isPrimary, companyId } = req.body;

        if (isPrimary) {
            await db.models.Bank.update(
                { isPrimary: false },
                { where: { companyId } }
            );
        }

        const response = await myServices.update(
            db.models.Bank,
            req.params.id,
            req.body
        );

        return res.status(response.success ? 200 : 404).json(response);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete Bank
 */
exports.deleteBank = async (req, res) => {
    try {
        const response = await myServices.delete(db.models.Bank, req.params.id);
        return res.status(response.success ? 200 : 404).json(response);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


exports.bankListByCompanyId = async (req, res) => {
    try {
        const { companyId, limit = 10, offset = 0 } = req.query;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "companyId is required"
            });
        }
        const where = { companyId };
        const result = await service.list(
            db.models.Bank,
            null,
            where,
            parseInt(limit),
            parseInt(offset)
        );

        if (!result.success) {
            return res.status(500).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Error fetching banks: ${error.message}`
        });
    }
};