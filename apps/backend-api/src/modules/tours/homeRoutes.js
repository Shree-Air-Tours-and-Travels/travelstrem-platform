import express from "express";
import { getTourHome } from "./controllers/tourHomeController.js";

const router = express.Router();

router.get("/home.json", getTourHome);

export default router;
