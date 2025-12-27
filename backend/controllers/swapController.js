const { z } = require("zod");
const { db } = require("../config/firebase");
const admin = require("firebase-admin");

// Firestore collections
const STUDENTS_COLLECTION = 'students';
const SWAP_REQUESTS_COLLECTION = 'swapRequests';

exports.acceptSwap = async (req, res) => {
  try {
    const { requesterId } = req.body;
    if (!requesterId)
      return res.status(400).json({ message: "requesterId is required" });

    const currentUserId = req.user.id; // The one accepting (Target)

    // Find the swap request
    const swapSnapshot = await db.collection(SWAP_REQUESTS_COLLECTION)
      .where('requesterId', '==', requesterId)
      .where('targetStudentId', '==', currentUserId)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (swapSnapshot.empty) {
      return res.status(404).json({ message: "No pending swap request found from this user." });
    }

    const swapDoc = swapSnapshot.docs[0];
    const swapData = swapDoc.data();

    // Get both students from Firestore
    const studentADoc = await db.collection(STUDENTS_COLLECTION).doc(requesterId).get();
    const studentBDoc = await db.collection(STUDENTS_COLLECTION).doc(currentUserId).get();

    if (!studentADoc.exists || !studentBDoc.exists) {
      return res.status(404).json({ message: "One of the students no longer exists." });
    }

    const studentA = studentADoc.data();
    const studentB = studentBDoc.data();

    // Perform the room exchange
    const roomA = {
      hostel: studentA.hostel,
      bedType: studentA.bedType,
      roomNumber: studentA.roomNumber,
    };

    const roomB = {
      hostel: studentB.hostel,
      bedType: studentB.bedType,
      roomNumber: studentB.roomNumber,
    };

    // Swap A -> B
    await db.collection(STUDENTS_COLLECTION).doc(requesterId).update({
      hostel: roomB.hostel,
      bedType: roomB.bedType,
      roomNumber: roomB.roomNumber,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Swap B -> A
    await db.collection(STUDENTS_COLLECTION).doc(currentUserId).update({
      hostel: roomA.hostel,
      bedType: roomA.bedType,
      roomNumber: roomA.roomNumber,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update swap request status
    await db.collection(SWAP_REQUESTS_COLLECTION).doc(swapDoc.id).update({
      status: "accepted",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: "Swap accepted! Rooms have been exchanged." });
  } catch (err) {
    console.error("Accept Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.listSwaps = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all swap requests where user is requester or target
    const requesterSnapshot = await db.collection(SWAP_REQUESTS_COLLECTION)
      .where('requesterId', '==', userId)
      .get();
    
    const targetSnapshot = await db.collection(SWAP_REQUESTS_COLLECTION)
      .where('targetStudentId', '==', userId)
      .get();

    const requests = [];
    
    requesterSnapshot.forEach(doc => {
      const data = doc.data();
      requests.push({ 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      });
    });
    
    targetSnapshot.forEach(doc => {
      // Avoid duplicates
      if (!requests.find(r => r.id === doc.id)) {
        const data = doc.data();
        requests.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        });
      }
    });

    res.json({ swaps: requests });
  } catch (err) {
    console.error("List Error:", err);
    res.status(500).json({ message: "Failed to list swaps" });
  }
};
