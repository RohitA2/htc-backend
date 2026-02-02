const multer = require("multer");
const path = require("path");
const fs = require("fs");

const rootDir = path.resolve(__dirname, "..");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderName = "challan";
    const uploadPath = path.join(rootDir, "uploads", folderName);

    fs.mkdirSync(uploadPath, { recursive: true });

    // 🔥 store folderName for later use
    req.uploadFolder = folderName;

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const unique =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    const fileName = unique + path.extname(file.originalname);

    // 🔥 attach full relative path
    file.relativePath = path
      .join("uploads", req.uploadFolder, fileName)
      .replace(/\\/g, "/");

    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Invalid file type"), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = upload;
