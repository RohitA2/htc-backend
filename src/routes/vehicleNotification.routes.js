const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/vehicleNotification.controller');

router.get('/', ctrl.getNotifications);
router.get('/pagination', ctrl.getNotificationPagination);
router.put('/resolve/:id', ctrl.markResolved);
router.delete('/:id', ctrl.deleteNotification);

module.exports = router;