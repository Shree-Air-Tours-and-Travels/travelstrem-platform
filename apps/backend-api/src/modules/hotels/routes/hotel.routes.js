import express from "express";
import { authMiddleware } from "../../../shared/auth/index.js";
import {
    createHotelEnquiry,
    getHotelDetails,
    getHotelDetailWidget,
    getHotelPage,
    getHotelResults,
    quoteHotelRooms,
    searchHotels,
} from "../controllers/hotel.controller.js";

const router = express.Router();
router.get("/page.json", getHotelPage);
router.post("/search", searchHotels);
router.get("/search/:searchId/results", getHotelResults);
router.get("/search/:searchId/hotels/:hotelId", getHotelDetails);
router.get("/search/:searchId/hotels/:hotelId/widgets/:widget", getHotelDetailWidget);
router.post("/search/:searchId/hotels/:hotelId/quote", quoteHotelRooms);
router.post("/enquiries", authMiddleware, createHotelEnquiry);
export default router;
