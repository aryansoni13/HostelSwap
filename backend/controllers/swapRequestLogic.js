const { z } = require("zod");
const { db } = require("../config/firebase");
const admin = require("firebase-admin");

// Firestore collections
const STUDENTS_COLLECTION = "students";
const SWAP_REQUESTS_COLLECTION = "swapRequests";

/**
 * Helper to safely find a student without crashing on ID casting
 */
async function findStudentSafely(input) {
  if (!input) return null;
  const cleanInput = input.trim();

  console.log(`[Lookup] Attempting to find student by: '${cleanInput}'`);

  // 1. Email Search
  if (cleanInput.includes("@")) {
    console.log(`[Lookup] Strategy: EMAIL`);
    const snapshot = await db
      .collection(STUDENTS_COLLECTION)
      .where("email", "==", cleanInput.toLowerCase())
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  }

  // 2. UID Search (Firebase UID format)
  // Firebase UIDs are typically 28 characters
  if (cleanInput.length >= 20 && cleanInput.length <= 30) {
    try {
      console.log(`[Lookup] Strategy: UID`);
      const doc = await db
        .collection(STUDENTS_COLLECTION)
        .doc(cleanInput)
        .get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      console.log(
        `[Lookup] UID valid format but not found, falling back to name...`
      );
    } catch (e) {
      console.log(`[Lookup] UID Query failed gracefully: ${e.message}`);
    }
  }

  // 3. Name Search (Fallback)
  console.log(`[Lookup] Strategy: NAME`);
  const snapshot = await db
    .collection(STUDENTS_COLLECTION)
    .where("name", ">=", cleanInput)
    .where("name", "<=", cleanInput + "\uf8ff")
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  return null;
}

exports.requestSwapSafe = async (req, res) => {
  console.log("\n==================================");
  console.log(" SAFE SWAP REQUEST CONTROLLER V2 (Firebase)");
  console.log("==================================");
  console.log("Searching for:", req.body.targetStudentId);

  try {
    const { targetStudentId } = req.body;

    if (!targetStudentId || typeof targetStudentId !== "string") {
      return res.status(400).json({ message: "Invalid input." });
    }

    const input = targetStudentId.trim();
    let target = null;
    let method = "";

    // 1. Email Lookup
    if (input.includes("@")) {
      method = "Email";
      try {
        const snapshot = await db
          .collection(STUDENTS_COLLECTION)
          .where("email", "==", input.toLowerCase())
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          target = { id: doc.id, ...doc.data() };
        }
      } catch (err) {
        console.error("Email lookup error:", err);
      }
    }
    // 2. UID Lookup
    else if (input.length >= 20 && input.length <= 30) {
      method = "UID";
      try {
        const doc = await db.collection(STUDENTS_COLLECTION).doc(input).get();
        if (doc.exists) {
          target = { id: doc.id, ...doc.data() };
        }
        // If UID lookup didn't find anything, fall through to name lookup
        if (!target) {
          method = "Name";
          try {
            const snapshot = await db
              .collection(STUDENTS_COLLECTION)
              .where("name", ">=", input)
              .where("name", "<=", input + "\uf8ff")
              .limit(1)
              .get();

            if (!snapshot.empty) {
              const doc = snapshot.docs[0];
              target = { id: doc.id, ...doc.data() };
            }
          } catch (nameErr) {
            console.error("Name lookup error:", nameErr);
          }
        }
      } catch (err) {
        console.error("UID lookup error:", err);
        // If UID lookup fails, fall through to name lookup
        method = "Name";
        try {
          const snapshot = await db
            .collection(STUDENTS_COLLECTION)
            .where("name", ">=", input)
            .where("name", "<=", input + "\uf8ff")
            .limit(1)
            .get();

          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            target = { id: doc.id, ...doc.data() };
          }
        } catch (nameErr) {
          console.error("Name lookup error:", nameErr);
        }
      }
    }
    // 3. Name Lookup
    else {
      method = "Name";
      try {
        const snapshot = await db
          .collection(STUDENTS_COLLECTION)
          .where("name", ">=", input)
          .where("name", "<=", input + "\uf8ff")
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          target = { id: doc.id, ...doc.data() };
        }
      } catch (err) {
        console.error("Name lookup error:", err);
      }
    }

    console.log(`Method: ${method}, Found: ${target ? "YES" : "NO"}`);

    if (!target) {
      return res.status(404).json({
        message: `Student not found. Please check the email, ID, or name you entered.`,
      });
    }

    // Success - Create Request
    const requesterId = req.user.id;
    if (target.uid === requesterId || target.id === requesterId) {
      return res.status(400).json({ message: "Cannot swap with yourself" });
    }

    // Check for duplicate requests
    const duplicateSnapshot = await db
      .collection(SWAP_REQUESTS_COLLECTION)
      .where("requesterId", "==", requesterId)
      .where("targetStudentId", "==", target.uid || target.id)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!duplicateSnapshot.empty) {
      return res.status(400).json({
        message: "You already have a pending swap request for this student.",
      });
    }

    // Fetch requester details to store in the request
    const requesterDoc = await db
      .collection(STUDENTS_COLLECTION)
      .doc(requesterId)
      .get();
    if (!requesterDoc.exists) {
      return res.status(404).json({ message: "Requester account not found." });
    }
    const requesterData = requesterDoc.data();

    // Bed Type Check - STRICT
    if (requesterData.bedType !== target.bedType) {
      return res.status(400).json({
        message: `You can only swap with students having the same bed type. Your room is ${requesterData.bedType}, but the target is in a ${target.bedType} room.`,
      });
    }

    // Add to Firestore
    const swapRequestData = {
      requesterId: requesterId,
      requesterName: requesterData.name,
      requesterEmail: requesterData.email,
      requesterHostel: requesterData.hostel,
      requesterRoom: requesterData.roomNumber,
      requesterBedType: requesterData.bedType,

      targetStudentId: target.uid || target.id,
      targetName: target.name,
      targetEmail: target.email,
      targetHostel: target.hostel,
      targetRoom: target.roomNumber,
      targetBedType: target.bedType,

      status: "pending",
      message: req.body.message || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db
      .collection(SWAP_REQUESTS_COLLECTION)
      .add(swapRequestData);

    res.json({
      message: `Request sent to ${target.name}!`,
      requestId: docRef.id,
    });
  } catch (err) {
    console.error("SAFE CONTROLLER ERROR:", err);
    res.status(500).json({
      message: err.message || "Server Error",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

exports.acceptSwapSafe = async (req, res) => {
  // Simple implementation for accept
  res.json({ message: "Swap accepted (Placeholder logic)" });
};

exports.listSwapsSafe = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all swap requests where user is requester or target
    const requesterSnapshot = await db
      .collection(SWAP_REQUESTS_COLLECTION)
      .where("requesterId", "==", userId)
      .get();

    const targetSnapshot = await db
      .collection(SWAP_REQUESTS_COLLECTION)
      .where("targetStudentId", "==", userId)
      .get();

    const requests = [];

    requesterSnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });

    targetSnapshot.forEach((doc) => {
      // Avoid duplicates
      if (!requests.find((r) => r.id === doc.id)) {
        requests.push({ id: doc.id, ...doc.data() });
      }
    });

    res.json({ swaps: requests });
  } catch (err) {
    console.error("List swaps error:", err);
    res.status(500).json({ message: "Failed to list swaps" });
  }
};
