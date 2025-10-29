const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const Report = require("../models/reportModel"); // ✅ Import model
const jwt = require("jsonwebtoken"); // if you want userId from token

// ✅ Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ✅ Upload Image Controller
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // 🧾 Get report type from frontend
    const { reportType } = req.body;
    if (!reportType) {
      return res.status(400).json({ message: "Report type is required" });
    }

    // 🧾 Get userId from token (optional but professional)
    const token = req.headers.authorization?.split(" ")[1];
    let userId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        console.warn("Invalid token");
      }
    }

    // 🖼️ Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "uploads",
    });

    // 🧹 Remove from local
    fs.unlinkSync(req.file.path);

    // 💾 Save to MongoDB
    const newReport = await Report.create({
      userId,
      reportType,
      url: result.secure_url,
      status: "processing",
    });

    // 🟢 Respond to frontend
    res.status(200).json({
      message: "Image uploaded successfully",
      url: result.secure_url,
      reportId: newReport._id,
      status: newReport.status,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

module.exports = { upload, uploadImage };
