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
  "booking-engine": "booking-engine/config.json",
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

export const getBookingEngineConfig = (req, res) => {
  try {
    const page = readJson(PAGE_FILES["booking-engine"]);
    const product = String(req.query.product || "").toLowerCase();
    if (product === "trevio") {
      page.component.data.config.tripEndpoint = "/trevio/trips/{tripRef}.json";
      page.component.data.config.pricingEndpoint = "/trevio/trips/{tripRef}/pricing";
      page.component.data.config.availabilityEndpoint = "/trevio/trips/{tripRef}/availability";
      page.component.data.config.pricingMethod = "POST";
      page.component.data.config.submitEndpoint = "/trevio/bookings";
      page.component.data.config.paymentEndpoint = "/trevio/bookings/{bookingId}/payment";
    }
    return res.status(200).json(page);
  } catch (error) {
    console.error("getBookingEngineConfig error:", error);
    return res.status(500).json({ status: "error", message: "Failed to load booking engine configuration" });
  }
};
