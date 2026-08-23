import express from "express";
import {
    getForm,
    submitForm,
    getLeads,
    getEnquiry,
    claimEnquiry,
} from "./controllers/formController.js";
import { authMiddleware } from "../../shared/auth/index.js";
import { readPortalAccessToken } from "../../core/auth/portalSession.js";
const router = express.Router();

const optionalSubmitAuth = (req, res, next) => {
    const authorization = String(req.headers.authorization || req.headers.Authorization || "");
    const hasSession = authorization.startsWith("Bearer ") || Boolean(readPortalAccessToken(req));
    return hasSession ? authMiddleware(req, res, next) : next();
};

router.get("/form.json", getForm);
router.post("/submit.json", optionalSubmitAuth, submitForm);
router.post("/enquiries/claim", authMiddleware, claimEnquiry);
router.get("/enquiries", authMiddleware, getLeads);
router.get("/enquiries/:id", authMiddleware, getEnquiry);
router.get("/form.leads.json", authMiddleware, getLeads); // compatibility alias

export default router;
