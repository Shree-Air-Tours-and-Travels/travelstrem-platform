import express from "express";
import {
    getClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
    uploadClientLogo,
    getClientBySlug,
} from "./controllers/clientController.js";
import { upload } from "../../services/cloudinary.js";
import authMiddleware from "../../shared/auth/middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getClients);
router.get("/by-slug/:slug", getClientBySlug);
router.get("/:id", authMiddleware, getClient);
router.post("/", authMiddleware, createClient);
router.put("/:id", authMiddleware, updateClient);
router.delete("/:id", authMiddleware, deleteClient);
router.post("/:id/logo", authMiddleware, upload.single("image"), uploadClientLogo);

export default router;
