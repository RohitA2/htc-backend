const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Project root
const rootDir = path.resolve(__dirname, "..");

// Allowed file types
const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/pdf",
  "video/mp4"
];

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folderName = req.params.folderName;

    if (!folderName) {
      return cb(new Error("Folder name is required"));
    }

    // 🔐 Sanitize folder name
    folderName = folderName.replace(/[^a-zA-Z0-9_-]/g, "");

    const uploadPath = path.join(rootDir, "uploads", folderName);

    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, `${uniqueName}${path.extname(file.originalname)}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid file type"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// Upload API
router.post(
  "/media/:folderName",
  upload.array("mediaFiles", 10),
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const files = req.files.map((file) =>
        path
          .join("uploads", req.params.folderName, file.filename)
          .replace(/\\/g, "/")
      );

      res.status(200).json({
        success: true,
        message: "Files uploaded successfully",
        files,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Upload failed",
      });
    }
  }
);

module.exports = router;
