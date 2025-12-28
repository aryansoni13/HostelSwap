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
