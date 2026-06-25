const express = require("express");
const router = express.Router();
const ptAllocationController = require("../controllers/ptAllocationController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/allocate", verifyToken, ptAllocationController.allocateEntries);
router.get("/list", verifyToken, ptAllocationController.getAllocations);
router.post("/delete", verifyToken, ptAllocationController.deleteAllocations);

module.exports = router;
