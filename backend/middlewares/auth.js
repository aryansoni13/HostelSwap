const { auth, db } = require("../config/firebase");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);

    // Determine role: check custom claims first, then Firestore
    let role = decodedToken.role || "student";

    // If no custom claim, check if user exists in 'admins' collection
    if (!decodedToken.role) {
      try {
        const adminDoc = await db
          .collection("admins")
          .doc(decodedToken.uid)
          .get();
        if (adminDoc.exists) {
          role = "admin";
        }
      } catch (e) {
        // Firestore check failed, default to student
        console.log("Admin check skipped:", e.message);
      }
    }

    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email,
      role: role,
    };
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
