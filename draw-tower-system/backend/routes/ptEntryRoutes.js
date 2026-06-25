const express = require("express");
const router = express.Router();
const ptEntryController = require("../controllers/ptEntryController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/create", verifyToken, ptEntryController.createEntry);
router.get("/:drawBarcode", verifyToken, ptEntryController.getDrawDetails);

module.exports = router;
