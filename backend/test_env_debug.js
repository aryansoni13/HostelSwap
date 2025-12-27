require("dotenv").config();
console.log("Start Test");
console.log("CWD:", process.cwd());
console.log("MONGO_URI:", process.env.MONGODB_URI);
console.log("End Test");
