const functions = require("firebase-functions");
const app = require("./app");

// Expose the Express app as a Cloud Function called 'api'
exports.api = functions.https.onRequest(app);
