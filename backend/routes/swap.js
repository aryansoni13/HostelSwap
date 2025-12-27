const express = require("express");
const router = express.Router();
const swapController = require("../controllers/swapController");
const safeController = require("../controllers/swapRequestLogic"); // New Safe Logic
const authMiddleware = require("../middlewares/auth");

router.post("/request", authMiddleware, safeController.requestSwapSafe); // Updated to V2
router.post("/accept", authMiddleware, swapController.acceptSwap);
router.get("/list", authMiddleware, swapController.listSwaps);

module.exports = router;
