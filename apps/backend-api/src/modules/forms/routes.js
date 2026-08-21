import express from "express";
import { getForm, submitForm, getLeads, claimEnquiry } from "./controllers/formController.js";
import { authMiddleware } from "../../shared/auth/index.js";
const router = express.Router();

router.get("/form.json", getForm);
router.post("/submit.json", submitForm);
router.post("/enquiries/claim", authMiddleware, claimEnquiry);
router.get("/form.leads.json", authMiddleware, getLeads); // optional admin endpoint

export default router;
