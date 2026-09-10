import ApiError from "../../../shared/errors/ApiError.js";
import FlightService from "../services/flight.service.js";
import { presentFlightDetails } from "../presenters/flight-details.presenter.js";
import { validateBookingInput, validateFlightSearch, validateRevalidation } from "../schemas/flight.validation.js";

export const flightService = new FlightService();
const validationError = (errors) => new ApiError(400, "Flight request validation failed", errors);

export const searchFlights = async (req, res, next) => {
    try {
        const validation = validateFlightSearch(req.body);
        if (!validation.ok) throw validationError(validation.errors);
        const search = await flightService.search(validation.value, req.user);
        const results = await flightService.results(search.searchId, req.body);
        res.setHeader("Cache-Control", "no-store, private");
        return res.status(200).json({ status: "success", data: results });
    } catch (error) { return next(error); }
};

export const getFlightResults = async (req, res, next) => {
    try {
        const data = await flightService.results(req.params.searchId, req.query);
        res.setHeader("Cache-Control", "no-store, private");
        return res.status(200).json({ status: "success", data });
    } catch (error) { return next(error); }
};

export const getFlightOffer = async (req, res, next) => {
    try {
        const offer = await flightService.getOffer(req.params.searchId, req.params.offerId);
        const details = presentFlightDetails(offer);
        const fareDetails = new Map(details.fares.map((fare) => [fare.fareId, fare]));
        return res.status(200).json({
            status: "success",
            data: {
                ...offer,
                fares: offer.fares.map((fare) => ({ ...fare, selectable: fareDetails.get(fare.fareId)?.selectable !== false })),
                details,
            },
        });
    }
    catch (error) { return next(error); }
};

export const searchAirports = (req, res) => res.status(200).json({ status: "success", data: { airports: flightService.searchAirports(req.query.q) } });

export const revalidateFlight = async (req, res, next) => {
    try {
        const validation = validateRevalidation(req.body);
        if (!validation.ok) throw validationError(validation.errors);
        return res.status(200).json({ status: "success", data: await flightService.revalidate(validation.value) });
    } catch (error) { return next(error); }
};

export const createFlightEnquiry = async (req, res, next) => {
    try {
        const validation = validateRevalidation(req.body);
        if (!validation.ok) throw validationError(validation.errors);
        return res.status(201).json({
            status: "success",
            message: "Flight enquiry created",
            data: await flightService.createEnquiry(validation.value, req.user),
        });
    } catch (error) { return next(error); }
};

export const getSeatMap = async (req, res, next) => {
    try { return res.status(200).json({ status: "success", data: await flightService.seatMap(req.params.offerId) }); }
    catch (error) { return next(error); }
};

export const createFlightBooking = async (req, res, next) => {
    try {
        const validation = validateBookingInput(req.body);
        if (!validation.ok) throw validationError(validation.errors);
        return res.status(201).json({ status: "success", data: await flightService.createBooking(validation.value, req.user) });
    } catch (error) { return next(error); }
};

export const getFlightBooking = async (req, res, next) => {
    try { return res.status(200).json({ status: "success", data: await flightService.getBooking(req.params.bookingId, req.user) }); }
    catch (error) { return next(error); }
};

export const getFlightBookingByPnr = async (req, res, next) => {
    try { return res.status(200).json({ status: "success", data: await flightService.getBooking(req.params.pnr, req.user, true) }); }
    catch (error) { return next(error); }
};

export const cancelFlightBooking = async (req, res, next) => {
    try { return res.status(200).json({ status: "success", data: await flightService.cancelBooking(req.params.bookingId, req.user) }); }
    catch (error) { return next(error); }
};
