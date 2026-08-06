import bcrypt from "bcryptjs";
import User from "../models/User.js";
import UserRepository from "../repositories/UserRepository.js";
import RefreshToken from "../models/RefreshToken.js";
import { audit } from "../../tenancy/audit.service.js";

const PROFILE_ICONS = [
    "user", "compass", "map", "globe", "plane", "train",
    "bus", "taxi", "hotel", "destination", "beach", "mountain",
    "camera", "heart", "star", "sun", "moon", "sparkles",
];

export const getProfile = async (req, res) => {
    try {
        const userId = req.user?.sub;
        const user = await UserRepository.findById(userId, "-passwordHash");
        if (!user) return res.status(404).json({ status: "error", message: "User not found" });
        const data = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar || "user",
            createdAt: user.createdAt,
        };
        return res.status(200).json({
            status: "success",
            componentData: { data, config: { icons: PROFILE_ICONS } },
        });
    } catch (error) {
        console.error("getProfile error:", error);
        return res.status(500).json({ status: "error", message: "Failed to get profile" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.sub;
        const { name, avatar, phone } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (avatar !== undefined) {
            if (!PROFILE_ICONS.includes(avatar)) {
                return res.status(400).json({ status: "error", message: "Invalid avatar icon" });
            }
            updates.avatar = avatar;
        }
        if (phone !== undefined) updates.phone = phone;
        const before = await UserRepository.findById(userId, "name phone avatar agencyId").lean();
        const user = await UserRepository.updateProfile(userId, updates);
        if (!user) return res.status(404).json({ status: "error", message: "User not found" });
        await audit(req, { action: "user.profile_updated", entityType: "User", entityId: user._id, agencyId: user.agencyId, before, after: { name: user.name, phone: user.phone, avatar: user.avatar } });
        const data = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar || "user",
            createdAt: user.createdAt,
        };
        return res.status(200).json({
            status: "success",
            componentData: { data, config: { icons: PROFILE_ICONS } },
        });
    } catch (error) {
        console.error("updateProfile error:", error);
        return res.status(500).json({ status: "error", message: "Failed to update profile" });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const userId = req.user?.sub;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ status: "error", message: "Current password and new password are required" });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ status: "error", message: "New password must be at least 8 characters" });
        }
        const user = await UserRepository.findById(userId);
        if (!user) return res.status(404).json({ status: "error", message: "User not found" });
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ status: "error", message: "Current password is incorrect" });
        }
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await UserRepository.updatePassword(userId, passwordHash);

        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();
        await RefreshToken.deleteMany({ userId });
        await audit(req, { action: "user.password_changed", entityType: "User", entityId: user._id, agencyId: user.agencyId });

        return res.status(200).json({ status: "success", message: "Password updated successfully" });
    } catch (error) {
        console.error("updatePassword error:", error);
        return res.status(500).json({ status: "error", message: "Failed to update password" });
    }
};
