import { createBookingJourneyHandler } from "./bookingJourneyHandler.mjs";

export { createBookingJourneyHandler } from "./bookingJourneyHandler.mjs";
export { presentBookingJourney } from "./bookingJourneyPresenter.mjs";
export { createQuoteBuilderService } from "./quote-builder/quoteBuilderService.mjs";
export { allowedCustomerQuoteActions, resolveCustomerQuoteDecision } from "./quote-builder/customerQuoteActions.mjs";
export {
  buildTravellerDetailsForm,
  validateTravellerDetails,
  buildProductEnquiryDetailsForm,
  validateProductEnquiryDetails,
  buildTripEnquiryDetailsForm,
  validateTripEnquiryDetails,
} from "./travellerDetailsService.mjs";
export { createQuoteBuilderHandlers } from "./quote-builder/quoteBuilderHandlers.mjs";
export { createQuoteProcessDefinition } from "./quote-builder/quoteProcessDefinition.mjs";

export function registerBookingJourneyRoute({
  router,
  authMiddleware,
  findAuthorizedBooking,
  findCurrentQuote,
}) {
  router.get(
    "/booking-engine/bookings/:bookingId/journey",
    authMiddleware,
    createBookingJourneyHandler({ findAuthorizedBooking, findCurrentQuote }),
  );
  return router;
}
