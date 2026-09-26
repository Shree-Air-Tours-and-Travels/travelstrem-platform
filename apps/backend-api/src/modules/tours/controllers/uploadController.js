import Tour from "../models/Tour.js";
import { canModifyTour } from "./tourController.js";
import { importRemoteTourImage } from "../../../services/cloudinary.js";

const normalizeUrl = (filePath = "") => {
    if (/^https?:\/\//i.test(filePath)) return filePath;
    const parts = String(filePath).split(/[/\\]/);
    return `/uploads/${parts[parts.length - 1]}`;
};

const getUploadedFileUrl = (file) =>
    normalizeUrl(file?.secure_url || file?.url || file?.path || "");
const getUploadedFilePublicId = (file) => file?.public_id || file?.filename || "";

export const uploadTourImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: "error", message: "No file uploaded." });
        }

        const url = getUploadedFileUrl(req.file);
        const publicId = getUploadedFilePublicId(req.file);

        return res.json({
            status: "success",
            message: "Image uploaded successfully",
            componentData: {
                data: {
                    url,
                    secure_url: url,
                    public_id: publicId,
                },
            },
        });
    } catch (err) {
        console.error("[uploadTourImage] error:", err?.message || err);
        return res.status(500).json({ status: "error", message: "Image upload failed." });
    }
};

export const importTourImageUrl = async (req, res) => {
    try {
        const url = await importRemoteTourImage(req.body?.url);
        return res.json({
            status: "success",
            message: "Image imported successfully",
            componentData: { data: { url, secure_url: url } },
        });
    } catch (err) {
        console.error("[importTourImageUrl] error:", err?.message || err);
        return res
            .status(err.status || 400)
            .json({ status: "error", message: err.message || "Image import failed." });
    }
};

export const uploadAndAttachPhotos = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ status: "error", message: "No files uploaded." });
        }

        const tour = await Tour.findById(req.params.id);
        if (!tour) {
            return res.status(404).json({ status: "error", message: "Tour not found." });
        }

        if (!canModifyTour(req.user, tour, req.access)) {
            return res.status(403).json({
                status: "error",
                message: "You do not have permission to modify this tour.",
            });
        }

        const urls = req.files.map(getUploadedFileUrl).filter(Boolean);
        tour.photos.push(...urls);

        if (!tour.photo) {
            tour.photo = urls[0];
        }

        await tour.save();

        return res.json({
            status: "success",
            message: "Photos uploaded successfully",
            photos: tour.photos,
            added: urls,
            componentData: {
                data: {
                    photos: tour.photos,
                    added: urls,
                },
            },
        });
    } catch (err) {
        console.error("[uploadAndAttachPhotos] error:", err?.message || err);
        return res
            .status(500)
            .json({ status: "error", message: "Failed to upload and attach photos." });
    }
};
