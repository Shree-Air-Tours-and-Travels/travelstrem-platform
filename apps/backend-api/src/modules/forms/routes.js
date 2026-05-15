import express from "express";
import { getForm, submitForm, getLeads } from "./controller.js";
const router = express.Router();

router.get("/form.json", getForm);
router.post("/submit.json", submitForm);
router.get("/form.leads.json", getLeads); // optional admin endpoint

export default router;
