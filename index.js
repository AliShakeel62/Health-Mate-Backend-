const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const imageRoutes = require('./routes/imageRoutes');


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
// --------------------
// Frontend origin allow karo
app.use(cors());



// -------------------- Body Parsing --------------------
app.use(bodyParser.json()); // JSON body parse karega
app.use(bodyParser.urlencoded({ extended: true })); // Form data parse karega
// app.use(express.json()); // optional, bodyParser.json() already hai

// -------------------- Database --------------------
connectDB();

// -------------------- Routes --------------------
app.use("/api/auth", authRoutes);
app.use("/api/image", imageRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("API is running successfully!");
});
console.log("Cloudnary key ===" + process.env.CLOUDINARY_CLOUD_NAME);
// -------------------- Start Server --------------------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
