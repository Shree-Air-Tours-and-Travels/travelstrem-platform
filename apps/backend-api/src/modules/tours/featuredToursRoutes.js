import express from "express";
import { getFeaturedTours } from "./controllers/featuredToursController.js";

const router = express.Router();

router.get("/", getFeaturedTours);

export default router;
