const fs = require("fs");
const { DATABASE_PATH } = require("../database/db");

if (fs.existsSync(DATABASE_PATH)) {
  fs.unlinkSync(DATABASE_PATH);
  console.log("Existing LensLab database removed.");
} else {
  console.log("No existing database found.");
}
console.log("Start the server with npm start to create a fresh database.");
