const db = require("../config/database");
const { Op } = require("sequelize");
const myServices = require("../services/myServices");

/**
 * Create Company
 */
exports.createCompany = async (req, res) => {
    try {
        const response = await myServices.create(db.models.Company, req.body);
        return res.status(response.success ? 201 : 400).json(response);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get Company by ID
 */
exports.getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;
        const response = await myServices.read(db.models.Company, id);
        return res.status(response.success ? 200 : 404).json(response);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get All Companies
 */
exports.getAllCompanies = async (req, res) => {
    try {
        const { limit = 10, offset = 0, status } = req.query;

        const where = {};
        if (status) where.status = status;

        const response = await myServices.list(
            db.models.Company,
            null,
            where,
            parseInt(limit),
            parseInt(offset)
        );

        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Paginated Companies
 */
exports.getCompaniesPagination = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      startDate,
      endDate,
    } = req.query;

    const where = {};

    // ✅ Status filter
    if (status) {
      where.status = status;
    }

    // ✅ Search filter (companyName, email, GST, person, phone)
    if (search) {
      where[Op.or] = [
        { companyName: { [Op.iLike]: `%${search}%` } },
        { companyEmail: { [Op.iLike]: `%${search}%` } },
        { gstNo: { [Op.iLike]: `%${search}%` } },
        { personName: { [Op.iLike]: `%${search}%` } },
        { phoneNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // ✅ Date range filter (createdAt)
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const response = await myServices.listPagination(
      db.models.Company,
      null,
      parseInt(page),
      parseInt(limit),
      where
    );

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update Company by ID
 */
exports.updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const response = await myServices.update(db.models.Company, id, req.body);
        return res.status(response.success ? 200 : 404).json(response);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete Company
 */
exports.deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const response = await myServices.delete(db.models.Company, id);
        return res.status(response.success ? 200 : 404).json(response);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Check Company by Email or GST
 */
exports.checkCompanyExist = async (req, res) => {
    try {
        const { companyEmail, gstNo } = req.query;

        const where = {};
        if (companyEmail) where.companyEmail = companyEmail;
        if (gstNo) where.gstNo = gstNo;

        const response = await myServices.checkExist(db.models.Company, where);
        return res.status(response.success ? 200 : 404).json(response);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
