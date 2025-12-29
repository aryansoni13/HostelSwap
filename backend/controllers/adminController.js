const { z } = require("zod");
const { db } = require("../config/firebase");
const admin = require("firebase-admin");

const hostelNameEnum = z.enum([
  "block1",
  "block2",
  "block3",
  "block4",
  "block5",
  "block6",
  "block7",
  "block8",
]);

const HOSTELS_COLLECTION = "hostels";

exports.increaseRooms = async (req, res) => {
  try {
    const { hostel, count, bedType } = z
      .object({
        hostel: hostelNameEnum,
        count: z.number().min(1),
        bedType: z.enum(["4 bedded", "3 bedded", "2 bedded", "1 bedded"]),
      })
      .parse(req.body);

    const hostelRef = db.collection(HOSTELS_COLLECTION).doc(hostel);
    const hostelDoc = await hostelRef.get();

    let hostelData;
    if (!hostelDoc.exists) {
      // Create new hostel
      hostelData = {
        name: hostel,
        totalRooms: 0,
        rooms: [],
      };
      await hostelRef.set(hostelData);
    } else {
      hostelData = hostelDoc.data();
    }

    const startRoom = hostelData.totalRooms + 1;
    const newRooms = [];
    for (let i = 0; i < count; i++) {
      newRooms.push({
        roomNumber: startRoom + i,
        bedType,
        availableBeds: parseInt(bedType[0]),
      });
    }

    await hostelRef.update({
      rooms: admin.firestore.FieldValue.arrayUnion(...newRooms),
      totalRooms: admin.firestore.FieldValue.increment(count),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updatedDoc = await hostelRef.get();
    res.json({ message: "Rooms increased", hostel: updatedDoc.data() });
  } catch (err) {
    console.error("Increase rooms error:", err);
    res.status(400).json({ message: err.errors ? err.errors : err.message });
  }
};

exports.decreaseRooms = async (req, res) => {
  try {
    const { hostel, count, bedType } = z
      .object({
        hostel: hostelNameEnum,
        count: z.number().min(1),
        bedType: z.enum(["4 bedded", "3 bedded", "2 bedded", "1 bedded"]),
      })
      .parse(req.body);

    const hostelRef = db.collection(HOSTELS_COLLECTION).doc(hostel);
    const hostelDoc = await hostelRef.get();

    if (!hostelDoc.exists) {
      return res.status(400).json({ message: "Hostel not found" });
    }

    const hostelData = hostelDoc.data();

    // Find rooms of the specified bed type
    const roomsOfType = hostelData.rooms.filter(
      (room) => room.bedType === bedType
    );
    if (roomsOfType.length < count) {
      return res.status(400).json({
        message: `Not enough ${bedType} rooms to remove. Available: ${roomsOfType.length}, Requested: ${count}`,
      });
    }

    // Remove the specified number of rooms of the given bed type (from the end)
    const roomsToRemove = roomsOfType.slice(-count);
    const roomNumbersToRemove = roomsToRemove.map((room) => room.roomNumber);

    const updatedRooms = hostelData.rooms.filter(
      (room) => !roomNumbersToRemove.includes(room.roomNumber)
    );

    await hostelRef.update({
      rooms: updatedRooms,
      totalRooms: admin.firestore.FieldValue.increment(-count),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updatedDoc = await hostelRef.get();
    res.json({
      message: `${count} ${bedType} room(s) removed from ${hostel}`,
      hostel: updatedDoc.data(),
    });
  } catch (err) {
    console.error("Decrease rooms error:", err);
    res.status(400).json({ message: err.errors ? err.errors : err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const snapshot = await db.collection("students").get();
    const users = [];
    snapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;
    await db.collection("students").doc(id).update({ isVerified });
    res.json({
      message: `User ${isVerified ? "verified" : "unverified"} successfully`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getHostelStats = async (req, res) => {
  try {
    const snapshot = await db.collection(HOSTELS_COLLECTION).get();
    const stats = [];
    snapshot.forEach((doc) => {
      stats.push(doc.data());
    });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllSwapRequests = async (req, res) => {
  try {
    const snapshot = await db
      .collection("swapRequests")
      .orderBy("createdAt", "desc")
      .get();
    const requests = [];
    snapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminUpdateSwapStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    // In a real scenario, approval might need complex logic (swapping rooms effectively)
    // For now, we update the status field.
    await db.collection("swapRequests").doc(id).update({ status });
    res.json({ message: `Request ${status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
