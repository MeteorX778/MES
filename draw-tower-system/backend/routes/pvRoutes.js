const express = require("express");
const router = express.Router();
const pvController = require("../controllers/pvController");
const verifyToken = require("../middleware/authMiddleware");

router.get("/meta-options", verifyToken, pvController.getDynamicOptions);
router.post("/create", verifyToken, pvController.createPvEntry);
router.get("/list", verifyToken, pvController.getPvEntries);
router.post("/grade-batch", verifyToken, pvController.gradeBatchEntries);
router.post("/delete-batch", verifyToken, pvController.deleteBatchEntries);

module.exports = router;
