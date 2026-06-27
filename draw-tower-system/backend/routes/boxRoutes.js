const express = require("express");
const router = express.Router();
const boxController = require("../controllers/boxController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/save", verifyToken, boxController.saveBoxManifest);
router.get("/list", verifyToken, boxController.getBoxManifests);
router.post("/delete", verifyToken, boxController.deleteBoxManifests);

module.exports = router;
