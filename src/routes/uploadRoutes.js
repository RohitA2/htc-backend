const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Set root directory
const rootDir = path.resolve(__dirname, ".."); // Moves to project root

// Multer Storage Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderName = req.params.folderName; // Get folderName from URL param
    if (!folderName) {
      return cb(new Error("Folder name is required."));
    }

    // Create folder dynamically if not exists
    const uploadFolder = path.join(rootDir, "uploads", folderName);
    fs.mkdirSync(uploadFolder, { recursive: true }); // Ensure folder exists
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Upload Route
router.post(
  "/media/:folderName",
  upload.array("mediaFiles", 10), // Accept up to 10 files
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "No files uploaded." });
      }

      // Prepare response for uploaded files
      const uploadedFiles = req.files.map(
        (file) =>
          path
            .join("uploads", req.params.folderName, file.filename)
            .replace(/\\/g, "/") // Replace backslashes with forward slashes
      );

      res.status(200).json({
        success: true,
        message: "Files uploaded successfully.",
        files: uploadedFiles, // Returns clean file paths
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Error uploading files." });
    }
  }
);

module.exports = router;
