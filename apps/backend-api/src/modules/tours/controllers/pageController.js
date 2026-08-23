import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import masterDataService from "../../masterData/services/masterDataService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../../data");

const PAGE_FILES = {
    home: "tours-remote/home/page.json",
    listing: "tours-remote/listing/page.json",
    details: "tours-remote/details/page.json",
    toursManagement: "agent-shell/services/tours-management/page.json",
};

const readJson = (...segments) => {
    const filePath = path.resolve(DATA_DIR, ...segments);
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

const sendPage = async (res, file) => {
    const page = readJson(file);
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
