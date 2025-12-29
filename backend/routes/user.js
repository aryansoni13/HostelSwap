const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/auth");

// All routes here should be protected
router.use(authMiddleware);

router.put("/profile", userController.updateProfile);
router.post("/upload-id-card", userController.uploadIdCard);
router.post("/request-verification", userController.requestVerification);

module.exports = router;
