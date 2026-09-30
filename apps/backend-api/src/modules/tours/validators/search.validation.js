import {
    DEFAULT_TOUR_PAGE_SIZE,
    LEGACY_SORT_ALIASES,
    MAX_TOUR_PAGE_SIZE,
    TOUR_SEARCH_SORT,
    TOUR_SEARCH_SORT_LIST,
} from "../search/tourSearch.constants.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const compactStringArray = (value, field, errors) => {
    if (value == null || value === "") return [];
    const list = Array.isArray(value) ? value : [value];
    if (list.length > 30) errors[field] = "Choose no more than 30 values";
    return [
        ...new Set(
            list
                .map((item) =>
                    String(item || "")
                        .trim()
                        .toLowerCase(),
                )
                .filter(Boolean),
        ),
    ];
};

const optionalNumber = (
    value,
    field,
    errors,
    { min = 0, max = Number.MAX_SAFE_INTEGER, integer = false } = {},
) => {
    if (value == null || value === "") return null;
    const number = Number(value);
    if (!Number.isFinite(number)) {
        errors[field] = "Enter a valid number";
        return null;
    }
    if (integer && !Number.isInteger(number)) errors[field] = "Enter a whole number";
    else if (number < min) errors[field] = `Minimum value is ${min}`;
    else if (number > max) errors[field] = `Maximum value is ${max}`;
    return number;
};

const optionalDate = (value, field, errors) => {
    if (value == null || value === "") return null;
    const text = String(value).trim();
    if (!DATE_PATTERN.test(text)) {
        errors[field] = "Use YYYY-MM-DD format";
        return null;
    }
    const date = new Date(`${text}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) {
        errors[field] = "Enter a valid date";
        return null;
    }
    return text;
};

const normalizeSort = (value, errors) => {
    const raw = String(value || TOUR_SEARCH_SORT.RECOMMENDED).trim();
    const normalized = LEGACY_SORT_ALIASES[raw.toLowerCase()] || raw.toUpperCase();
    if (!TOUR_SEARCH_SORT_LIST.includes(normalized)) {
        errors.sort = `Sort must be one of: ${TOUR_SEARCH_SORT_LIST.join(", ")}`;
        return TOUR_SEARCH_SORT.RECOMMENDED;
    }
    return normalized;
};

export const normalizeTourSearchRequest = (body = {}) => {
    const errors = {};
    const sourceFilters =
        body.filters && typeof body.filters === "object" && !Array.isArray(body.filters)
            ? body.filters
            : {};
    const query = String(body.query ?? sourceFilters.query ?? sourceFilters.search ?? "")
        .trim()
        .slice(0, 120);

    const minPrice = optionalNumber(
        sourceFilters.price?.min ?? sourceFilters.minPrice,
        "filters.price.min",
        errors,
    );
    const maxPrice = optionalNumber(
        sourceFilters.price?.max ?? sourceFilters.maxPrice,
        "filters.price.max",
        errors,
    );
    const minDays = optionalNumber(
        sourceFilters.duration?.minDays ?? sourceFilters.minDays,
        "filters.duration.minDays",
        errors,
        { min: 1, max: 365, integer: true },
    );
    const maxDays = optionalNumber(
        sourceFilters.duration?.maxDays ?? sourceFilters.maxDays,
        "filters.duration.maxDays",
        errors,
        { min: 1, max: 365, integer: true },
    );
    const travellers = optionalNumber(
        sourceFilters.travellers ?? sourceFilters.groupSize,
        "filters.travellers",
        errors,
        { min: 1, max: 500, integer: true },
    );
    const departureDate = optionalDate(
        sourceFilters.departureDate ?? sourceFilters.arrivalDate,
        "filters.departureDate",
        errors,
    );
    const returnDate = optionalDate(sourceFilters.returnDate, "filters.returnDate", errors);

    if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
        errors["filters.price"] = "Minimum price cannot exceed maximum price";
    }
    if (minDays != null && maxDays != null && minDays > maxDays) {
        errors["filters.duration"] = "Minimum duration cannot exceed maximum duration";
    }
    if (departureDate && returnDate && departureDate > returnDate) {
        errors["filters.dates"] = "Departure date cannot be after return date";
    }

    let featured = sourceFilters.featured;
    if (featured === "true") featured = true;
    if (featured === "false") featured = false;
    if (featured !== true && featured !== false && featured != null && featured !== "") {
        errors["filters.featured"] = "Featured must be true, false, or empty";
    }

    const page =
        optionalNumber(body.page, "page", errors, { min: 1, max: 100000, integer: true }) ?? 1;
    const pageSize =
        optionalNumber(body.pageSize ?? body.limit, "pageSize", errors, {
            min: 1,
            max: MAX_TOUR_PAGE_SIZE,
            integer: true,
        }) ?? DEFAULT_TOUR_PAGE_SIZE;

    const canonical = {
        query,
        filters: {
            originCityIds: compactStringArray(
                sourceFilters.originCityIds ?? sourceFilters.originCity,
                "filters.originCityIds",
                errors,
            ),
            destinationCityIds: compactStringArray(
                sourceFilters.destinationCityIds ??
                    sourceFilters.destinationCity ??
                    sourceFilters.city,
                "filters.destinationCityIds",
                errors,
            ),
            countryIds: compactStringArray(
                sourceFilters.countryIds ?? sourceFilters.country,
                "filters.countryIds",
                errors,
            ),
            agencyIds: compactStringArray(
                sourceFilters.agencyIds ?? sourceFilters.agencies ?? sourceFilters.agency,
                "filters.agencyIds",
                errors,
            ),
            price: { min: minPrice, max: maxPrice },
            duration: { minDays, maxDays },
            travellers,
            departureDate,
            returnDate,
            tagIds: compactStringArray(
                sourceFilters.tagIds ?? sourceFilters.tags,
                "filters.tagIds",
                errors,
            ),
            featured: featured === true || featured === false ? featured : null,
        },
        sort: normalizeSort(body.sort, errors),
        page,
        pageSize,
    };

    return { ok: Object.keys(errors).length === 0, errors, value: canonical };
};

export const requireTourSearchBody = (req, res, next) => {
    const result = normalizeTourSearchRequest(req.body || {});
    if (!result.ok) {
        return res.status(400).json({
            status: "error",
            code: "INVALID_TOUR_SEARCH",
            message: "Invalid tour search request",
            errors: result.errors,
        });
    }
    req.tourSearch = result.value;
    return next();
};

export default requireTourSearchBody;
