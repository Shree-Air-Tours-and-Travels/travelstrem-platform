import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../../data");

const PAGE_FILES = {
  listing: "tours-remote/listing/page.json",
  details: "tours-remote/details/page.json",
  booking: "tours-remote/booking/page.json",
  "booking-summary": "tours-remote/booking-summary/page.json",
  "booking-checkout": "tours-remote/booking-checkout/page.json",
};

const readJson = (...segments) => {
  const filePath = path.resolve(DATA_DIR, ...segments);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

export const getToursPage = (req, res) => {
  try {
    const page = readJson(PAGE_FILES.listing);
    return res.status(200).json(page);
  } catch (error) {
    console.error("getToursPage error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to load page configuration",
    });
  }
};

export const getTourDetailsPage = (req, res) => {
  try {
    const page = readJson(PAGE_FILES.details);
    return res.status(200).json(page);
  } catch (error) {
    console.error("getTourDetailsPage error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to load page configuration",
    });
  }
};

export const getBookingPage = (req, res) => {
  try {
    const page = readJson(PAGE_FILES.booking);
    return res.status(200).json(page);
  } catch (error) {
    console.error("getBookingPage error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to load page configuration",
    });
  }
};

export const getBookingSummaryPage = (req, res) => {
  try {
    const page = readJson(PAGE_FILES["booking-summary"]);
    return res.status(200).json(page);
  } catch (error) {
    console.error("getBookingSummaryPage error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to load page configuration",
    });
  }
};

export const getBookingCheckoutPage = (req, res) => {
  try {
    const page = readJson(PAGE_FILES["booking-checkout"]);
    return res.status(200).json(page);
  } catch (error) {
    console.error("getBookingCheckoutPage error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to load page configuration",
    });
  }
};
