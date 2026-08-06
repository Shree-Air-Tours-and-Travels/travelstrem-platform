import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import path from "path";
import fs from "fs";
import config from "../config/index.js";

const CLOUDINARY_NAME = config.CLOUDINARY_NAME || process.env.CLOUDINARY_NAME || "";
const CLOUDINARY_KEY = config.CLOUDINARY_KEY || process.env.CLOUDINARY_KEY || "";
const CLOUDINARY_SECRET = config.CLOUDINARY_SECRET || process.env.CLOUDINARY_SECRET || "";

const isConfigured = Boolean(CLOUDINARY_NAME && CLOUDINARY_KEY && CLOUDINARY_SECRET);

if (isConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY_NAME,
    api_key: CLOUDINARY_KEY,
    api_secret: CLOUDINARY_SECRET,
  });
}

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

const limits = { fileSize: 10 * 1024 * 1024 };

let storage;

if (isConfigured) {
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "travelstrem/tours",
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
      transformation: [{ width: 1600, crop: "limit", quality: "auto" }],
    },
  });
} else {
  const uploadsDir = path.resolve("uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });
}

export const upload = multer({ storage, fileFilter, limits });

const documentFileFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  cb(allowed.includes(file.mimetype) ? null : new Error(`Unsupported document type: ${file.mimetype}`), allowed.includes(file.mimetype));
};
const documentStorage = isConfigured ? new CloudinaryStorage({
  cloudinary,
  params: { folder: "travelstrem/partnership-documents", resource_type: "auto" },
}) : storage;
export const documentUpload = multer({ storage: documentStorage, fileFilter: documentFileFilter, limits: { fileSize: 8 * 1024 * 1024, files: 9 } });

export default cloudinary;
