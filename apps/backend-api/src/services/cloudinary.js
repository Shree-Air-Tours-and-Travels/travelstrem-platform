import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import axios from "axios";
import path from "path";
import fs from "fs";
import config from "../config/index.js";
import {
  extractPageImageUrl,
  isCloudinaryImageUrl,
  isImageMimeType,
  isUnsplashPhotoPageUrl,
  normalizeRemoteImageUrl,
} from "./imageUploadPolicy.js";

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
  if (isImageMimeType(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

const limits = { fileSize: 10 * 1024 * 1024 };
const tourImageOptions = {
  folder: "travelstrem/tours",
  resource_type: "image",
  transformation: [{ width: 1600, crop: "limit", quality: "auto" }],
};

let storage;

if (isConfigured) {
  storage = new CloudinaryStorage({
    cloudinary,
    params: tourImageOptions,
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

const resolveRemoteImageUrl = async (sourceUrl) => {
  const url = normalizeRemoteImageUrl(sourceUrl);
  if (!isUnsplashPhotoPageUrl(url)) return url;

  try {
    const response = await axios.get(url, {
      headers: { Accept: "text/html", "User-Agent": "Travelstrem-Image-Importer/1.0" },
      responseType: "text",
      timeout: 10000,
      maxContentLength: 3 * 1024 * 1024,
    });
    const imageUrl = extractPageImageUrl(response.data);
    if (!imageUrl) throw new Error("No preview image was found on this Unsplash page.");
    return normalizeRemoteImageUrl(imageUrl);
  } catch (error) {
    throw Object.assign(new Error(`Could not resolve the Unsplash photo page: ${error.message}`), { status: 400 });
  }
};

export const importRemoteTourImage = async (sourceUrl) => {
  const url = await resolveRemoteImageUrl(sourceUrl);
  if (!isConfigured) {
    throw Object.assign(new Error("Cloudinary must be configured to import an image URL."), { status: 503 });
  }
  if (isCloudinaryImageUrl(url, CLOUDINARY_NAME)) return url;

  try {
    const result = await cloudinary.uploader.upload(url, tourImageOptions);
    if (!result?.secure_url) throw new Error("Cloudinary returned no image URL.");
    return result.secure_url;
  } catch (error) {
    throw Object.assign(new Error(`Could not import the remote image: ${error.message}`), { status: error.status || 400 });
  }
};

export const localizeTourImageUrls = async (tour = {}) => {
  const values = [tour.photo, ...(Array.isArray(tour.photos) ? tour.photos : [])]
    .map((value) => String(value || "").trim())
    .filter((value) => /^https?:\/\//i.test(value));
  const externalUrls = [...new Set(values.filter((url) => !isCloudinaryImageUrl(url, CLOUDINARY_NAME)))];
  if (externalUrls.length === 0) return tour;

  const results = await Promise.allSettled(externalUrls.map(async (url) => [url, await importRemoteTourImage(url)]));
  const configurationError = results.find((result) => result.status === "rejected" && result.reason?.status === 503);
  if (configurationError) throw configurationError.reason;

  const imported = new Map(results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value));
  const rejected = new Set(results
    .map((result, index) => ({ result, url: externalUrls[index] }))
    .filter(({ result }) => result.status === "rejected")
    .map(({ url }) => url));
  const mainPhoto = String(tour.photo || "").trim();
  if (imported.has(mainPhoto)) tour.photo = imported.get(mainPhoto);
  else if (rejected.has(mainPhoto)) tour.photo = "";
  if (Array.isArray(tour.photos)) {
    tour.photos = tour.photos
      .map((url) => {
        const normalized = String(url || "").trim();
        if (rejected.has(normalized)) return null;
        return imported.get(normalized) || url;
      })
      .filter(Boolean);
  }
  if (!tour.photo && tour.photos?.length) tour.photo = tour.photos[0];
  return tour;
};

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
