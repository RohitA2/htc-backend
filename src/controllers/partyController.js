const db = require('../config/database');
const myServices = require('../services/myServices'); 

// CREATE - Add new Party
exports.createParty = async (req, res) => {
  try {
    const result = await myServices.create(db.models.Party, req.body);
    if (result.success) {
      return res.status(201).json(result);
    }
    return res.status(400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Server error while creating Party: ${error.message}`,
    });
  }
};

// READ - Get single Party by ID
exports.getPartyById = async (req, res) => {
  try {
    const result = await myServices.read(db.models.Party, req.params.id);
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(404).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error fetching Party: ${error.message}`,
    });
  }
};

// UPDATE - Update Party by ID
exports.updateParty = async (req, res) => {
  try {
    const result = await myServices.update(db.models.Party, req.params.id, req.body);
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(404).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error updating Party: ${error.message}`,
    });
  }
};

// DELETE - Delete Party by ID
exports.deleteParty = async (req, res) => {
  try {
    const result = await myServices.delete(db.models.Party, req.params.id);
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(404).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error deleting Party: ${error.message}`,
    });
  }
};

// LIST - Get all Parties (with optional search)
exports.getAllParties = async (req, res) => {
  try {
    const { search } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { partyName: { [Op.like]: `%${search}%` } },
        { partyPhone: { [Op.like]: `%${search}%` } },
      ];
    }

    const result = await myServices.list(db.models.Party, null, where);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error fetching Parties: ${error.message}`,
    });
  }
};

// PAGINATION - Get Parties with pagination & filters
exports.getPartiesPagination = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    const where = {};
    if (search) {
      where[Op.or] = [
        { partyName: { [Op.like]: `%${search}%` } },
        { partyPhone: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const result = await myServices.listPagination(db.models.Party, null, parseInt(page), parseInt(limit), where);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error fetching paginated Parties: ${error.message}`,
    });
  }
};

// Optional: Bulk Delete (if needed)
exports.bulkDeleteParties = async (req, res) => {
  try {
    const { ids } = req.body; // Expect array of IDs
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No IDs provided for deletion' });
    }

    const deleted = await db.models.Party.destroy({
      where: { id: { [Op.in]: ids } },
    });

    return res.status(200).json({
      success: true,
      message: `${deleted} Parties deleted successfully`,
      deletedCount: deleted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error in bulk delete: ${error.message}`,
    });
  }
};