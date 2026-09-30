import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import masterDataService from "../../masterData/services/masterDataService.js";
import Tour from "../models/Tour.js";
import { buildCustomTourPrefill } from "../../forms/services/customTourEnquiry.service.js";
import { normalizeMongoId } from "../../forms/services/departureOptionService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../../data");

const PAGE_FILES = {
    home: "tours-remote/home/page.json",
    listing: "tours-remote/listing/page.json",
    details: "tours-remote/details/page.json",
    customize: "tours-remote/customize/page.json",
    toursManagement: "agent-shell/services/tours-management/page.json",
};

const readJson = (...segments) => {
    const filePath = path.resolve(DATA_DIR, ...segments);
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

const sendPage = async (res, file, injectData = null) => {
    const page = readJson(file);
    if (injectData) {
        page.component.data = { ...(page.component.data || {}), ...injectData };
    }
    page.component = await masterDataService.hydrateDataScope(page.component);
    return res.status(200).json(page);
};

export const getToursHomePage = async (req, res) => {
    try {
        return await sendPage(res, PAGE_FILES.home);
    } catch (error) {
        console.error("getToursHomePage error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to load page configuration",
        });
    }
};

export const getToursPage = async (req, res) => {
    try {
        return await sendPage(res, PAGE_FILES.listing);
    } catch (error) {
        console.error("getToursPage error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to load page configuration",
        });
    }
};

export const getTourDetailsPage = async (req, res) => {
    try {
        return await sendPage(res, PAGE_FILES.details);
    } catch (error) {
        console.error("getTourDetailsPage error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to load page configuration",
        });
    }
};

export const getCustomizeTourPage = async (req, res) => {
    try {
        const sourceTourId = normalizeMongoId(req.query?.tourId);
        const sourceTour =
            sourceTourId && Tour.db.base.Types.ObjectId.isValid(sourceTourId)
                ? await Tour.findOne({ _id: sourceTourId, status: "published" }).lean()
                : null;
        return await sendPage(res, PAGE_FILES.customize, {
            prefill: buildCustomTourPrefill(sourceTour),
        });
    } catch (error) {
        console.error("getCustomizeTourPage error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to load page configuration",
        });
    }
};

export const getToursManagementPage = async (req, res) => {
    try {
        return await sendPage(res, PAGE_FILES.toursManagement);
    } catch (error) {
        console.error("getToursManagementPage error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to load page configuration",
        });
    }
};
