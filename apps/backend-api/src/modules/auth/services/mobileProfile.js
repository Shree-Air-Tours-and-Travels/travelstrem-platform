import User from "../models/User.js";
import { normalizeMobileNumber } from "./mobileAuth.service.js";

export const mobileProfilePolicy = Object.freeze({
    enabled: true,
    cooldownDays: 7,
    title: "Stay updated on your journey",
    description: "Add your mobile number so we can contact you about your enquiries and bookings. You’ll need it before creating an enquiry.",
    label: "Mobile number",
    placeholder: "+91 98765 43210",
    saveLabel: "Save number",
    dismissLabel: "Maybe later",
});

const hasNumber = (user) => {
    try { normalizeMobileNumber(user?.mobile || user?.phone); return true; }
    catch { return false; }
};

export const getMobileProfilePrompt = async (req, res, next) => {
    try {
        res.setHeader("Cache-Control", "no-store");
        const user = await User.findById(req.user.sub).select("mobile phone mobilePromptAfter").lean();
        if (!user || !mobileProfilePolicy.enabled || hasNumber(user))
            return res.json({ status: "success", data: null });
        const now = new Date();
        const claimed = await User.updateOne({
            _id: user._id,
            $or: [{ mobilePromptAfter: null }, { mobilePromptAfter: { $lte: now } }],
        }, { $set: { mobilePromptAfter: new Date(now.getTime() + mobileProfilePolicy.cooldownDays * 86400000) } });
        return res.json({ status: "success", data: claimed.modifiedCount ? mobileProfilePolicy : null });
    } catch (error) { next(error); }
};

export const requireEnquiryMobile = async (req, res, next) => {
    if (!req.user) return next();
    if (req.path === "/submit.json" && !["contact-agent", "custom-tour"].includes(
        String(req.query?.form || req.body?.form || "contact-agent"),
    )) return next();
    try {
        const user = await User.findById(req.user.sub).select("mobile phone").lean();
        if (!hasNumber(user) && !hasNumber({ phone: req.body?.fields?.phone || req.body?.phone })) return res.status(422).json({
            status: "error", code: "MOBILE_REQUIRED",
            message: "Enter a valid mobile number in the enquiry to continue.",
        });
        const enteredPhone = req.body?.fields?.phone || req.body?.phone;
        if (enteredPhone) {
            try { req.user.enquiryPhone = normalizeMobileNumber(enteredPhone); }
            catch { return res.status(422).json({ status: "error", code: "MOBILE_REQUIRED", message: "Enter a valid mobile number including its country code." }); }
            if (req.body.savePhoneToProfile === true) {
                await User.updateOne({ _id: req.user.sub }, { $set: { phone: req.user.enquiryPhone } });
            }
        }
        return next();
    } catch (error) { next(error); }
};
