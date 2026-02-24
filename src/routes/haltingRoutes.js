const express = require("express");
const router = express.Router();
const haltingController = require("../controllers/haltingController");


// router.post("/create", haltingController.createBilty);
router.get("/all", haltingController.getAllHaltingDetails);


module.exports = router;
