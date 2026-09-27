import express from "express";
import {
    getClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
    uploadClientLogo,
    getClientBySlug,
    listClientMembers,
    assignClientMember,
    removeClientMember,
} from "./controllers/clientController.js";
import { upload } from "../../services/cloudinary.js";
import authMiddleware from "../../shared/auth/middleware.js";
import User from "../auth/models/User.js";

const router = express.Router();

const requirePlatformAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user?.sub || req.user?.id)
            .select("role adminLevel adminApprovalStatus accountStatus tokenVersion")
            .lean();
        if (!user || user.role !== "admin" || (user.accountStatus || "active") !== "active" ||
            !["standard", "master"].includes(user.adminLevel) ||
            (user.adminLevel !== "master" && user.adminApprovalStatus !== "approved") ||
            Number(user.tokenVersion || 0) !== Number(req.user?.tokenVersion || 0))
            return res.status(403).json({ status: "error", message: "Access denied" });
        return next();
    } catch (error) {
        return next(error);
    }
};

router.get("/by-slug/:slug", getClientBySlug);
router.use(authMiddleware, requirePlatformAdmin);
router.get("/", getClients);
router.get("/:id/members", listClientMembers);
router.post("/:id/members", assignClientMember);
router.delete("/:id/members/:userId", removeClientMember);
router.get("/:id", getClient);
router.post("/", createClient);
router.put("/:id", updateClient);
router.delete("/:id", deleteClient);
router.post("/:id/logo", upload.single("image"), uploadClientLogo);

export default router;
