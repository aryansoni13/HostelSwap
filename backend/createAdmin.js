const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { auth, db } = require("./config/firebase");

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";
const ADMIN_EMAIL = `${ADMIN_USERNAME}@admin.hostelswap`;

async function createAdmin() {
  try {
    console.log(`\nStarting Admin Account Setup...`);
    console.log(`Target User: ${ADMIN_USERNAME} (${ADMIN_EMAIL})`);

    let userRecord;
    try {
      // Check if user exists
      userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
      console.log(
        "ℹ️  User already exists in Firebase Auth. Updating password..."
      );
      await auth.updateUser(userRecord.uid, {
        password: ADMIN_PASSWORD,
        displayName: ADMIN_USERNAME,
      });
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        console.log("✨ Creating new user in Firebase Auth...");
        userRecord = await auth.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          displayName: ADMIN_USERNAME,
        });
      } else {
        throw error;
      }
    }

    console.log(`✅ Auth setup complete. UID: ${userRecord.uid}`);
    console.log("📝 Initializing Firestore admin profile...");

    // Create/Update admin document
    await db.collection("admins").doc(userRecord.uid).set(
      {
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        role: "superadmin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );

    console.log("✅ Firestore profile created.");
    console.log("\n===========================================");
    console.log("   ADMIN ACCOUNT READY");
    console.log("===========================================");
    console.log(`   Username : ${ADMIN_USERNAME}`);
    console.log(`   Password : ${ADMIN_PASSWORD}`);
    console.log("===========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Failed to create admin:", error);
    process.exit(1);
  }
}

createAdmin();
