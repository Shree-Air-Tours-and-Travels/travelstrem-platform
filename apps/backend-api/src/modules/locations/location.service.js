import axios from "axios";
import config from "../../config/index.js";

const MODE_PRIMARY_TYPES = {
    city: ["(cities)"],
    region: ["(regions)"],
    airport: ["airport"],
};

const cleanText = (value, maxLength = 200) =>
    String(value || "")
        .trim()
        .slice(0, maxLength);

const cleanSessionToken = (value) => cleanText(value, 64).replace(/[^a-zA-Z0-9_-]/g, "");

const cleanCountries = (value) =>
    cleanText(value, 100)
        .split(",")
        .map((country) => country.trim().toLowerCase())
        .filter((country) => /^[a-z]{2}$/.test(country))
        .slice(0, 15);

const headers = (fieldMask) => ({
    "X-Goog-Api-Key": config.GOOGLE_PLACES_API_KEY,
    "X-Goog-FieldMask": fieldMask,
    "Content-Type": "application/json",
});

const ensureConfigured = () => {
    if (!config.GOOGLE_PLACES_API_KEY) {
        const error = new Error("Location suggestions are not configured.");
        error.statusCode = 503;
        throw error;
    }
};

const addressValue = (components, type, short = false) => {
    const component = components.find((item) => item.types?.includes(type));
    return cleanText(short ? component?.shortText : component?.longText, 160);
};

export const searchLocationSuggestions = async ({ input, mode, sessionToken, countries }) => {
    ensureConfigured();
    const query = cleanText(input, 160);
    if (query.length < 2) return [];

    const body = { input: query };
    const token = cleanSessionToken(sessionToken);
    const countryCodes = cleanCountries(countries);
    if (token) body.sessionToken = token;
    if (countryCodes.length) body.includedRegionCodes = countryCodes;
    if (MODE_PRIMARY_TYPES[mode]) body.includedPrimaryTypes = MODE_PRIMARY_TYPES[mode];

    const response = await axios.post(
        `${config.GOOGLE_PLACES_API_BASE_URL}/places:autocomplete`,
        body,
        {
            headers: headers(
                "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types",
            ),
            timeout: 5000,
        },
    );

    return (response.data?.suggestions || [])
        .map((suggestion) => suggestion.placePrediction)
        .filter((prediction) => prediction?.placeId)
        .slice(0, 8)
        .map((prediction) => ({
            placeId: cleanText(prediction.placeId, 300),
            label: cleanText(prediction.text?.text, 300),
            primaryText: cleanText(prediction.structuredFormat?.mainText?.text, 200),
            secondaryText: cleanText(prediction.structuredFormat?.secondaryText?.text, 300),
            types: (prediction.types || []).map((type) => cleanText(type, 80)).filter(Boolean),
        }));
};

export const getLocationDetails = async ({ placeId, sessionToken }) => {
    ensureConfigured();
    const id = cleanText(placeId, 300);
    if (!id) {
        const error = new Error("A place ID is required.");
        error.statusCode = 400;
        throw error;
    }
    const token = cleanSessionToken(sessionToken);
    const response = await axios.get(
        `${config.GOOGLE_PLACES_API_BASE_URL}/places/${encodeURIComponent(id)}`,
        {
            params: token ? { sessionToken: token } : undefined,
            headers: headers(
                "id,displayName,formattedAddress,addressComponents,location,types,googleMapsUri",
            ),
            timeout: 5000,
        },
    );
    const place = response.data || {};
    const components = Array.isArray(place.addressComponents) ? place.addressComponents : [];
    return {
        placeId: cleanText(place.id || id, 300),
        label: cleanText(place.displayName?.text || place.formattedAddress, 300),
        formattedAddress: cleanText(place.formattedAddress, 500),
        city:
            addressValue(components, "locality") ||
            addressValue(components, "postal_town") ||
            addressValue(components, "administrative_area_level_2"),
        state: addressValue(components, "administrative_area_level_1"),
        country: addressValue(components, "country"),
        countryCode: addressValue(components, "country", true).toUpperCase(),
        postalCode: addressValue(components, "postal_code"),
        latitude: Number.isFinite(place.location?.latitude) ? place.location.latitude : null,
        longitude: Number.isFinite(place.location?.longitude) ? place.location.longitude : null,
        types: (place.types || []).map((type) => cleanText(type, 80)).filter(Boolean),
        googleMapsUri: cleanText(place.googleMapsUri, 1000),
    };
};
