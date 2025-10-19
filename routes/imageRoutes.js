const express = require("express");
const { upload, uploadImage } = require("../controllers/imageController");
const { protect } = require("../middleware/authMiddleware"); // optional

const router = express.Router();

// POST /api/image/upload
router.post("/upload", protect, upload.single("report"), uploadImage);

module.exports = router;
