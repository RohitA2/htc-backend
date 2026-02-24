const Notification = require('../models/VehicleNotification');
const myServices = require('../services/myServices');

// GET ALL
exports.getNotifications = async (req, res) => {
    const result = await myServices.list(Notification);
    res.json(result);
};

// GET PAGINATION
exports.getNotificationPagination = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const result = await myServices.listPagination(Notification, null, page, limit);
    res.json(result);
};

// MARK RESOLVED
exports.markResolved = async (req, res) => {
    const result = await myServices.update(Notification, req.params.id, {
        isResolved: true
    });
    res.json(result);
};

// DELETE
exports.deleteNotification = async (req, res) => {
    const result = await myServices.delete(Notification, req.params.id);
    res.json(result);
};