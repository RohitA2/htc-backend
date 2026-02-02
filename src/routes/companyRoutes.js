const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");

// Create
router.post("/create", companyController.createCompany);

// Read
router.get("/get/:id", companyController.getCompanyById);
router.get("/list", companyController.getAllCompanies);
router.get("/pagination", companyController.getCompaniesPagination);

// Update
router.put("/update/:id", companyController.updateCompany);

// Delete
router.delete("/delete/:id", companyController.deleteCompany);

// Check exist
router.get("/check-exist", companyController.checkCompanyExist);

module.exports = router;
