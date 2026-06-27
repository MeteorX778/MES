const express = require("express");
const router = express.Router();
const qcController = require("../controllers/qcController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/verify", verifyToken, qcController.verifyBatchRecords);
router.post("/save", verifyToken, qcController.saveQcRecord);

module.exports = router;
