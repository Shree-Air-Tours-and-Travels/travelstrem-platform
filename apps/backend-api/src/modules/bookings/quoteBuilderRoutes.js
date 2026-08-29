import express from "express";
import { authMiddleware } from "../../shared/auth/index.js";
import {
    createBookingJourneyHandler,
    createQuoteBuilderHandlers,
} from "../../../../booking-engine/server/index.mjs";
import quoteBuilderService, {
    findAuthorizedBookingJourney,
    findCurrentBookingJourneyQuote,
    saveCustomerTravellerDetails,
    updateCustomerQuoteDecision,
} from "./quoteBuilderAdapter.js";

const router = express.Router();
const handlers = createQuoteBuilderHandlers(quoteBuilderService);

router.get(
    "/bookings/:bookingId/journey",
    authMiddleware,
    createBookingJourneyHandler({
        findAuthorizedBooking: findAuthorizedBookingJourney,
        findCurrentQuote: findCurrentBookingJourneyQuote,
    }),
);

router.get("/enquiries/:enquiryId/quote-builder", authMiddleware, handlers.load);
router.patch("/enquiries/:enquiryId/quote-builder", authMiddleware, handlers.transition);
router.post("/enquiries/:enquiryId/quote-builder/calculate", authMiddleware, handlers.preview);
router.post("/enquiries/:enquiryId/quote-builder/send", authMiddleware, handlers.send);
router.post("/enquiries/:enquiryId/quotes/:quoteId/decision", authMiddleware, async (req, res) => {
    try {
        const result = await updateCustomerQuoteDecision({
            enquiryId: req.params.enquiryId,
            quoteId: req.params.quoteId,
            actor: req.user,
            action: req.body?.action,
            notes: req.body?.notes,
        });
        return res.status(200).json({
            status: "success",
            message: "Your quote response has been saved.",
            componentData: {
                data: {
                    quoteId: String(result.quote._id),
                    quoteStatus: result.quote.status,
                    enquiryStatus: result.enquiry.status,
                },
            },
        });
    } catch (error) {
        return res.status(error?.status || 500).json({
            status: "error",
            message: error?.message || "Your quote response could not be saved.",
        });
    }
});
router.post("/enquiries/:enquiryId/travellers", authMiddleware, async (req, res) => {
    try {
        const result = await saveCustomerTravellerDetails({
            enquiryId: req.params.enquiryId,
            actor: req.user,
            values: req.body?.values,
        });
        return res.status(result.status).json({
            status: result.status < 400 ? "success" : "error",
            message: result.status < 400 ? "Traveller details saved." : "Check the highlighted traveller details.",
            componentData: { data: { errors: result.errors || {} } },
        });
    } catch (error) {
        return res.status(error?.status || 500).json({
            status: "error",
            message: error?.message || "Traveller details could not be saved.",
        });
    }
});

export default router;
