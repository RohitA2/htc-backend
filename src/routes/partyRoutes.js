// routes/partyRoutes.js
const express = require('express');
const router = express.Router();
const partyController = require('../controllers/partyController');

// Create new Party
router.post('/create', partyController.createParty);

// Get all Parties (with optional search)
router.get('/list', partyController.getAllParties);

// Get single Party by ID
router.get('/:id', partyController.getPartyById);

// Update Party by ID
router.put('/update/:id', partyController.updateParty);

// Delete Party by ID
router.delete('/delete/:id', partyController.deleteParty);


// Paginated list with search & filters
router.get('/pagination', partyController.getPartiesPagination);

// Bulk delete (optional)
router.delete('/bulk-delete', partyController.bulkDeleteParties);

module.exports = router;