import presentBookingJourney from "./bookingJourneyPresenter.mjs";

export function createBookingJourneyHandler({ findAuthorizedBooking, findCurrentQuote }) {
  return async function getBookingJourney(req, res) {
    try {
      const booking = await findAuthorizedBooking(req.params.bookingId, req.user);
      if (!booking) {
        return res.status(404).json({ status: "error", message: "Booking not found." });
      }

      const quote = await findCurrentQuote(booking.id);
      return res.json({
        status: "success",
        componentData: presentBookingJourney({
          booking,
          quote,
          actor: req.user,
          pathname: String(req.query.path || "").split("?")[0],
        }),
      });
    } catch (error) {
      return res.status(error?.status || 500).json({
        status: "error",
        message: error?.status ? error.message : "The booking journey could not be loaded.",
      });
    }
  };
}

export default createBookingJourneyHandler;
