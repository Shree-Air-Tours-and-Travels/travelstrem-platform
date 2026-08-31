import express from "express";
import {
    getMasterOptionSet,
    listMasterOptionSets,
    listPricingConfigs,
    upsertMasterOptionSet,
    upsertPricingConfig,
} from "./controllers/masterDataController.js";
import authMiddleware from "../../shared/auth/middleware.js";
import { loadAccessContext } from "../tenancy/policy.js";

const router = express.Router();

const masterAdminOnly = (req, res, next) =>
    req.access.isMaster
        ? next()
        : res.status(403).json({
              status: "error",
              message: "Only a Master Admin can manage master data.",
          });

router.get("/options/:key", getMasterOptionSet);
router.get(
    "/option-sets",
    authMiddleware,
    loadAccessContext,
    masterAdminOnly,
    listMasterOptionSets,
);
router.put(
    "/options/:key",
    authMiddleware,
    loadAccessContext,
    masterAdminOnly,
    upsertMasterOptionSet,
);
router.get(
    "/pricing-configs",
    authMiddleware,
    loadAccessContext,
    masterAdminOnly,
    listPricingConfigs,
);
router.put(
    "/pricing-configs",
    authMiddleware,
    loadAccessContext,
    masterAdminOnly,
    upsertPricingConfig,
);

export default router;
