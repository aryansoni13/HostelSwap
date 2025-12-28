const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/auth");

// All routes here should be protected
router.use(authMiddleware);

router.put("/profile", userController.updateProfile);

module.exports = router;
