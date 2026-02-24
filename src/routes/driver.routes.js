const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/driver.controller');

router.post('/', ctrl.createDriver);
router.get('/', ctrl.getDrivers);
router.get('/:id', ctrl.getDriver);
router.put('/:id', ctrl.updateDriver);
router.delete('/:id', ctrl.deleteDriver);

module.exports = router;