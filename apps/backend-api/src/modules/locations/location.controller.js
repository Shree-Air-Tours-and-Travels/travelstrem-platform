import { getLocationDetails, searchLocationSuggestions } from "./location.service.js";

const sendError = (res, error) => {
    const providerStatus = error?.response?.status;
    const statusCode = error.statusCode || (providerStatus === 400 ? 400 : 502);
    return res.status(statusCode).json({
        status: "error",
        message:
            statusCode === 503
                ? error.message
                : "Location search is temporarily unavailable. You can still enter it manually.",
    });
};

export const suggestLocations = async (req, res) => {
    try {
        const suggestions = await searchLocationSuggestions({
            input: req.query.q,
            mode: req.query.mode,
            sessionToken: req.query.sessionToken,
            countries: req.query.countries,
        });
        return res.json({ status: "success", data: { suggestions } });
    } catch (error) {
        return sendError(res, error);
    }
};

export const resolveLocation = async (req, res) => {
    try {
        const place = await getLocationDetails({
            placeId: req.params.placeId,
            sessionToken: req.query.sessionToken,
        });
        return res.json({ status: "success", data: { place } });
    } catch (error) {
        return sendError(res, error);
    }
};
