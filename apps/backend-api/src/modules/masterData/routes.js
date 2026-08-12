import express from "express";
import { getMasterOptionSet, listMasterOptionSets, upsertMasterOptionSet } from "./controllers/masterDataController.js";
import authMiddleware from "../../shared/auth/middleware.js";
import { loadAccessContext } from "../tenancy/policy.js";

const router = express.Router();

router.get("/options/:key", getMasterOptionSet);
router.get("/option-sets", authMiddleware, loadAccessContext, (req, res, next) => req.access.isMaster ? next() : res.status(403).json({ status: "error", message: "Only a Master Admin can manage master data." }), listMasterOptionSets);
router.put("/options/:key", authMiddleware, loadAccessContext, (req, res, next) => req.access.isMaster ? next() : res.status(403).json({ status: "error", message: "Only a Master Admin can manage master data." }), upsertMasterOptionSet);

export default router;
