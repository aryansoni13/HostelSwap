const { db } = require("../config/firebase");
const { z } = require("zod");

const STUDENTS_COLLECTION = "students";

// Validation schema for profile update
const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  hostel: z.string().min(1, "Hostel is required").optional(),
  roomNumber: z
    .number()
    .int()
    .positive("Room number must be positive")
    .optional(),
  bedType: z.string().min(1, "Bed type is required").optional(),
  email: z.string().email().optional(), // Usually email shouldn't be changed easily, but including for now as per frontend
});

exports.updateProfile = async (req, res) => {
  try {
    const uid = req.user.id;
    const updateData = req.body;

    // Validate input
    const validation = updateProfileSchema.safeParse(updateData);
    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid input data",
        errors: validation.error.errors,
      });
    }

    // Sanitize data (only allow specific fields)
    const allowedFields = ["name", "hostel", "roomNumber", "bedType"];
    const sanitizedData = {};

    // Only update fields that are present and allowed
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        sanitizedData[key] = updateData[key];
      }
    });

    // Add timestamp
    sanitizedData.updatedAt = new Date();

    // Update in Firestore
    await db.collection(STUDENTS_COLLECTION).doc(uid).update(sanitizedData);

    // Also update any swap requests where this user is the requester or target?
    // This is optional but good for consistency.
    // However, since we now fetch fresh data in SwapRequests.tsx, explicit update might not be strictly necessary immediately.
    // Let's keep it simple for now and rely on the "fresh fetch" logic we added earlier.

    res.json({
      message: "Profile updated successfully",
      user: {
        id: uid,
        ...sanitizedData,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// Upload ID card image (base64)
exports.uploadIdCard = async (req, res) => {
  try {
    const uid = req.user.id;
    const { idCardImage } = req.body;

    if (!idCardImage) {
      return res.status(400).json({ message: "ID card image is required" });
    }

    // Validate that it's a base64 string (basic check)
    if (!idCardImage.startsWith("data:image/")) {
      return res.status(400).json({
        message: "Invalid image format. Must be a base64 encoded image.",
      });
    }

    // Check size (rough estimate: base64 is ~33% larger than binary)
    // Limit to ~2MB to stay within Firestore document size limits
    const sizeInBytes = Buffer.from(
      idCardImage.split(",")[1] || "",
      "base64"
    ).length;
    if (sizeInBytes > 2 * 1024 * 1024) {
      return res
        .status(400)
        .json({ message: "Image too large. Maximum size is 2MB." });
    }

    // Update student document with ID card (use set with merge to create if not exists)
    await db.collection(STUDENTS_COLLECTION).doc(uid).set(
      {
        idCardUrl: idCardImage,
        idCardUploadedAt: new Date(),
      },
      { merge: true }
    );

    res.json({ message: "ID card uploaded successfully" });
  } catch (error) {
    console.error("Error uploading ID card:", error);
    res.status(500).json({ message: "Failed to upload ID card" });
  }
};

// Request verification from admin
exports.requestVerification = async (req, res) => {
  try {
    const uid = req.user.id;

    // Get current student data
    const studentDoc = await db.collection(STUDENTS_COLLECTION).doc(uid).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ message: "Student not found" });
    }

    const studentData = studentDoc.data();

    // Check if ID card is uploaded
    if (!studentData.idCardUrl) {
      return res.status(400).json({
        message: "Please upload your ID card before requesting verification",
      });
    }

    // Check if already verified
    if (studentData.isVerified) {
      return res.status(400).json({ message: "You are already verified" });
    }

    // Check if already pending
    if (studentData.verificationStatus === "pending") {
      return res
        .status(400)
        .json({ message: "You already have a pending verification request" });
    }

    // Update verification status
    await db.collection(STUDENTS_COLLECTION).doc(uid).set(
      {
        verificationStatus: "pending",
        verificationRequestedAt: new Date(),
      },
      { merge: true }
    );

    res.json({
      message:
        "Verification request submitted successfully. Please wait for admin approval.",
    });
  } catch (error) {
    console.error("Error requesting verification:", error);
    res.status(500).json({ message: "Failed to submit verification request" });
  }
};
