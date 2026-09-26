import presentBookingJourney from "./bookingJourneyPresenter.mjs";

export function createBookingJourneyHandler({ findAuthorizedBooking, findCurrentQuote }) {
  return async function getBookingJourney(req, res) {
    try {
      const booking = await findAuthorizedBooking(req.params.bookingId, req.user);
      if (!booking) {
        return res.status(404).json({ status: "error", message: "Booking not found." });
      }

      const quote = await findCurrentQuote(booking.id);
      const journeyBooking = {
        ...booking,
        requiresPassport:
          booking.requiresPassport ||
          quote?.items?.some(
            (item) => String(item?.category || "").toUpperCase() === "FLIGHT",
          ),
      };
      return res.json({
        status: "success",
        componentData: presentBookingJourney({
          booking: journeyBooking,
          quote,
          actor: req.user,
          pathname: String(req.query.path || "").split("?")[0],
          step: String(req.query.step || "").toLowerCase(),
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
