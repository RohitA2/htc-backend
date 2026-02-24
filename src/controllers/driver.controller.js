const Driver = require('../models/Driver');
const myServices = require('../services/myServices');

// CREATE
exports.createDriver = async (req, res) => {
    const result = await myServices.create(Driver, req.body);
    res.status(result.success ? 201 : 400).json(result);
};

// GET ALL
exports.getDrivers = async (req, res) => {
    const result = await myServices.list(Driver);
    res.json(result);
};

// GET ONE
exports.getDriver = async (req, res) => {
    const result = await myServices.read(Driver, req.params.id);
    res.json(result);
};

// UPDATE
exports.updateDriver = async (req, res) => {
    const result = await myServices.update(Driver, req.params.id, req.body);
    res.json(result);
};

// DELETE
exports.deleteDriver = async (req, res) => {
    const result = await myServices.delete(Driver, req.params.id);
    res.json(result);
};