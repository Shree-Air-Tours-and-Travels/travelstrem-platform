import express from "express";
import { getTrehubFlightJourney, getTrehubFlights, getTrehubHome } from "./controllers/trehubController.js";

const router = express.Router();

router.get("/home.json", getTrehubHome);
router.get("/flights.json", getTrehubFlights);
router.get("/flight-journey.json", getTrehubFlightJourney);

export default router;
