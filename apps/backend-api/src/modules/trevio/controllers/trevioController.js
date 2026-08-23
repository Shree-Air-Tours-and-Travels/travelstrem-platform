import pageDefinitionService from "../../../services/pageDefinitionService.js";
import masterDataService from "../../masterData/services/masterDataService.js";
import trevioTripService from "../services/trevioTripService.js";
import FinancialEngine from "../../../core/financial-engine/index.js";
import {
    minorToDecimal,
    percentToBasisPoints,
    rupeesToMinor,
} from "../../../core/financial-engine/utils/money.js";

const TREVIO_HOME_PAGE = "trevio-remote/home";
const QUICK_CHIPS_KEY = "trevio.quickChipOptions";

const loadTrevioTrips = async (req) => {
    try {
        const result = await trevioTripService.listTrips({
            ...req.query,
            limit: req.query?.limit || 100,
        });
        return {
            trips: result.trips,
            pagination: result.pagination,
        };
    } catch (error) {
        console.error("[TrevioController] Failed to load trips:", error.message);
        return {
            trips: [],
            pagination: {
                page: 1,
                limit: 100,
                total: 0,
                totalPages: 1,
                hasMore: false,
            },
        };
    }
};

export const getTrevioHome = async (req, res) => {
    const page = pageDefinitionService.buildPageResponse(TREVIO_HOME_PAGE);
    const [quickChipOptions, tripResult, intlResult] = await Promise.all([
        masterDataService.getOptionSet(QUICK_CHIPS_KEY),
        loadTrevioTrips(req),
        trevioTripService.listInternationalTrips({ limit: 3 }),
    ]);
    const trips = tripResult.trips || [];
    const featuredTrips = trips.filter((trip) => trip.featured);

    return res.status(200).json({
        ...page,
        component: {
            ...page.component,
            data: {
                ...page.component.data,
                state: {
                    ...(page.component.data.state || {}),
                    featuredTrips,
                    adventureTrips: trips,
                    tripPagination: tripResult.pagination,
                    internationalTrips: intlResult.trips || [],
                },
            },
            dataScope: {
                options: {
                    ...page.component.dataScope.options,
                    quickChipOptions,
                },
            },
        },
        message: "Trevio home fetched successfully",
    });
};

export const getTrevioTrips = async (req, res) => {
    const page = pageDefinitionService.buildPageResponse(TREVIO_HOME_PAGE);
    const [quickChipOptions, tripResult] = await Promise.all([
        masterDataService.getOptionSet(QUICK_CHIPS_KEY),
        loadTrevioTrips(req),
    ]);

    return res.status(200).json({
        status: "success",
        component: {
            data: {
                trips: tripResult.trips || [],
                pagination: tripResult.pagination,
            },
            dataScope: { options: { quickChipOptions } },
            elements: { labels: {}, urls: {} },
            structure: { header: {}, widgets: [], config: {}, actions: [] },
        },
        message: "Trevio trips fetched successfully",
    });
};

export const getTrevioTrip = async (req, res) => {
    try {
        const trip = await trevioTripService.findBySlug(req.params.tripRef);
        if (!trip) return res.status(404).json({ status: "error", message: "Trip not found" });
        return res.status(200).json({
            status: "success",
            component: { data: { trip: trevioTripService.normalize(trip) } },
        });
    } catch (error) {
        return res.status(500).json({ status: "error", message: "Failed to load trip" });
    }
};

const normalizeTripAddons = (trip) =>
    (Array.isArray(trip?.extras) ? trip.extras : [])
        .filter((extra) => extra && !extra.included)
        .map((extra, index) => {
            const priceLabel = String(extra.priceLabel || "").trim();
            return {
                // An add-on's id must be stable because the client sends it back when
                // recalculating and creating the booking.
                id: String(extra._id || extra.id || extra.code || extra.title || `extra-${index}`),
                name: extra.title || extra.name || "Optional add-on",
                description: extra.description || "",
                price: Math.max(0, Number(extra.price || extra.amount || 0)),
                currency: extra.currency || "INR",
                priceLabel,
                perTraveller: Boolean(
                    extra.perTraveller ||
                    extra.perPerson ||
                    /per\s*(person|travell?er)/i.test(priceLabel),
                ),
                selectionType: extra.selectionType || "multiple",
            };
        });

export const calculateTrevioPricing = async (trip, body = {}) => {
    const travellerList = Array.isArray(body.travellers || body.travelers)
        ? body.travellers || body.travelers
        : [];
    const travellers = Math.max(
        1,
        travellerList.length ||
            Number(body.values?.travellers || body.values?.travelers || body.values?.guests || 1),
    );
    const selected = (Array.isArray(body.addons) ? body.addons : [])
        .map((addon) => (typeof addon === "string" ? addon : addon?.id || addon?.code))
        .filter(Boolean);
    const availableAddons = normalizeTripAddons(trip);
    const addonsById = availableAddons.reduce((result, addon) => {
        result[addon.id] = addon;
        return result;
    }, {});
    const addonRows = selected
        .map((id) => addonsById[id])
        .filter(Boolean)
        .map((addon) => ({
            id: addon.id,
            label: addon.name,
            amount: addon.price * (addon.perTraveller ? travellers : 1),
        }));
    const tripData = trevioTripService.normalize(trip);
    const baseAmount = Number(tripData.price || 0) * travellers;
    const addonAmount = addonRows.reduce((sum, row) => sum + row.amount, 0);
    const preferences = tripData.preferences || {};
    const optionPrice = (options, value) =>
        Number(
            (Array.isArray(options) ? options : []).find((option) => option.value === value)
                ?.extraPrice || 0,
        );
    const roomType = String(body.roomType || body.values?.roomType || "");
    const roomAmount = optionPrice(preferences.roomTypes, roomType);
    const travellerPreferenceRows = travellerList
        .map((traveller, index) => {
            const amount =
                optionPrice(preferences.mealPreferences, traveller.mealPreference) +
                optionPrice(preferences.packageTypes, traveller.packageType) +
                optionPrice(preferences.drinkTypes, traveller.drinkType);
            return {
                id: `traveller-preferences-${index + 1}`,
                label: `Traveller ${index + 1} preferences`,
                amount,
            };
        })
        .filter((row) => row.amount !== 0);
    const preferenceAmount =
        roomAmount + travellerPreferenceRows.reduce((sum, row) => sum + row.amount, 0);
    const gstRate = Math.max(0, Number(process.env.TREVIO_GST_PERCENT || 0));
    const taxableAmount = Math.max(0, baseAmount + preferenceAmount + addonAmount);
    const requestedCoupon = String(body.couponCode || "")
        .trim()
        .toUpperCase();
    const configuredCoupon = String(process.env.TREVIO_COUPON_CODE || "")
        .trim()
        .toUpperCase();
    const couponPercent = Math.min(
        100,
        Math.max(0, Number(process.env.TREVIO_COUPON_DISCOUNT_PERCENT || 0)),
    );
    const couponValid = Boolean(
        requestedCoupon &&
        configuredCoupon &&
        requestedCoupon === configuredCoupon &&
        couponPercent > 0,
    );
    const tokenAmount = Number(tripData.token || 0) * travellers;
    const financialQuote = await FinancialEngine.calculateQuote({
        subtotalMinor: rupeesToMinor(taxableAmount),
        taxRateBasisPoints: percentToBasisPoints(gstRate),
        discountRateBasisPoints: couponValid ? percentToBasisPoints(couponPercent) : 0,
        fixedTokenMinor: rupeesToMinor(tokenAmount),
        currency: tripData.priceInfo?.currency || "INR",
    });
    const taxes = Number(minorToDecimal(financialQuote.pricing.taxAmountMinor));
    const discounts = Number(minorToDecimal(financialQuote.pricing.discountMinor));
    const grandTotal = Number(minorToDecimal(financialQuote.pricing.finalPayableMinor));
    const pricing = {
        currency: tripData.priceInfo?.currency || "INR",
        perPerson: Number(tripData.price || 0),
        baseAmount,
        basePrice: baseAmount,
        baseTripTotal: baseAmount,
        addonAmount,
        preferenceAmount,
        totalPrefExtras: preferenceAmount,
        taxes,
        discounts,
        serviceCharges: 0,
        convenienceFees: 0,
        tokenAmount: Math.min(tokenAmount, grandTotal),
        remainingBalance: Math.max(0, grandTotal - tokenAmount),
        grandTotal,
        total: grandTotal,
        availability: {
            ...(tripData.availability || {}),
            requestedGuests: travellers,
            canBook:
                tripData.availability?.seatsAvailable == null ||
                travellers <= Number(tripData.availability.seatsAvailable),
            validationMessage:
                tripData.availability?.seatsAvailable != null &&
                travellers > Number(tripData.availability.seatsAvailable)
                    ? `Only ${tripData.availability.seatsAvailable} seat${Number(tripData.availability.seatsAvailable) === 1 ? "" : "s"} available. Please reduce your group size.`
                    : "",
        },
        breakdown: [
            { id: "base", label: "Base Trip Price", amount: baseAmount },
            ...(roomAmount !== 0
                ? [{ id: "room", label: "Room preference", amount: roomAmount }]
                : []),
            ...travellerPreferenceRows,
            ...addonRows,
        ],
    };
    const coupon = requestedCoupon
        ? {
              valid: couponValid,
              code: requestedCoupon,
              message: couponValid
                  ? `${couponPercent}% discount applied.`
                  : "This coupon is invalid or unavailable.",
          }
        : null;

    return {
        pricing,
        addons: availableAddons,
        coupon,
        framework: {
            pricingSnapshot: financialQuote.pricing,
            financialSnapshot: financialQuote.financials,
            configSnapshot: financialQuote.config,
        },
    };
};

export const getTrevioPricing = async (req, res) => {
    try {
        const trip = await trevioTripService.findBySlug(req.params.tripRef);
        if (!trip) return res.status(404).json({ status: "error", message: "Trip not found" });
        const { framework, ...publicResult } = await calculateTrevioPricing(trip, req.body || {});
        return res.status(200).json({
            status: "success",
            component: { data: publicResult },
        });
    } catch (error) {
        console.error("getTrevioPricing error:", error);
        return res
            .status(500)
            .json({ status: "error", message: "Failed to calculate trip pricing" });
    }
};

export const getTrevioAvailability = async (req, res) => {
    try {
        const trip = await trevioTripService.findBySlug(req.params.tripRef);
        if (!trip) return res.status(404).json({ status: "error", message: "Trip not found" });
        const normalized = trevioTripService.normalize(trip);
        return res.status(200).json({
            status: "success",
            component: { data: { availability: normalized.availability || {} } },
        });
    } catch (error) {
        return res
            .status(500)
            .json({ status: "error", message: "Failed to load seat availability" });
    }
};
