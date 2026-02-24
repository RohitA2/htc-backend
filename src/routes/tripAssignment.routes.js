const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tripAssignment.controller');

router.post('/', ctrl.assignTrip);
router.get('/', ctrl.getAssignments);
router.put('/complete/:id', ctrl.completeTrip);

module.exports = router;