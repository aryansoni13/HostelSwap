const { db } = require("./config/firebase");

async function listUsers() {
  try {
    console.log("Fetching users from 'students' collection...");
    const snapshot = await db.collection("students").get();

    if (snapshot.empty) {
      console.log("No matching documents.");
      return;
    }

    console.log(`Found ${snapshot.size} users:`);
    snapshot.forEach((doc) => {
      console.log(doc.id, "=>", doc.data());
    });
  } catch (err) {
    console.error("Error fetching users:", err);
  }
}

listUsers();
