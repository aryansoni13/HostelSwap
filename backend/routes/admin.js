const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/auth");
const adminMiddleware = require("../middlewares/admin");

router.post(
  "/increase-rooms",
  authMiddleware,
  adminMiddleware,
  adminController.increaseRooms
);
router.post(
  "/decrease-rooms",
  authMiddleware,
  adminMiddleware,
  adminController.decreaseRooms
);
router.get("/users", authMiddleware, adminMiddleware, adminController.getUsers);
router.put(
  "/verify-user/:id",
  authMiddleware,
  adminMiddleware,
  adminController.verifyUser
);
router.get(
  "/stats",
  authMiddleware,
  adminMiddleware,
  adminController.getHostelStats
);
router.get(
  "/swaps",
  authMiddleware,
  adminMiddleware,
  adminController.getAllSwapRequests
);
router.put(
  "/swap-status/:id",
  authMiddleware,
  adminMiddleware,
  adminController.adminUpdateSwapStatus
);
router.get(
  "/pending-verifications",
  authMiddleware,
  adminMiddleware,
  adminController.getPendingVerifications
);

module.exports = router;
