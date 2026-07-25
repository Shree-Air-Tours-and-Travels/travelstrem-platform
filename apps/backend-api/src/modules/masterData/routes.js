import express from "express";
import { getMasterOptionSet } from "./controllers/masterDataController.js";

const router = express.Router();

router.get("/options/:key", getMasterOptionSet);

export default router;
