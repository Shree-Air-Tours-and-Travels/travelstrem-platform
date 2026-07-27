import pageDefinitionService from "../../../services/pageDefinitionService.js";
import masterDataService from "../../masterData/services/masterDataService.js";
import trevioTripService from "../services/trevioTripService.js";

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
    return res.status(200).json({ status: "success", component: { data: { trip: trevioTripService.normalize(trip) } } });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Failed to load trip" });
  }
};

const TREVIO_ADDONS = Object.freeze({
  standard: { id: "standard", name: "Standard Package", description: "Included travel essentials", price: 0, perTraveller: false, selectionType: "single" },
  drink: { id: "drink", name: "Drink Package", description: "Refreshments during the journey", price: 499, perTraveller: true, selectionType: "single" },
});

export const getTrevioPricing = async (req, res) => {
  try {
    const trip = await trevioTripService.findBySlug(req.params.tripRef);
    if (!trip) return res.status(404).json({ status: "error", message: "Trip not found" });
    const body = req.body || {};
    const travellers = Math.max(1, Array.isArray(body.travellers || body.travelers) ? (body.travellers || body.travelers).length : Number(body.values?.travellers || body.values?.travelers || body.values?.guests || 1));
    const selected = Array.isArray(body.addons) ? body.addons : [];
    const addonRows = selected.map((id) => TREVIO_ADDONS[id]).filter(Boolean).map((addon) => ({
      id: addon.id,
      label: addon.name,
      amount: addon.price * (addon.perTraveller ? travellers : 1),
    }));
    const tripData = trevioTripService.normalize(trip);
    const baseAmount = Number(tripData.price || 0) * travellers;
    const addonAmount = addonRows.reduce((sum, row) => sum + row.amount, 0);
    const grandTotal = baseAmount + addonAmount;
    const tokenAmount = Number(tripData.token || 0) * travellers;
    const pricing = {
      currency: tripData.priceInfo?.currency || "INR",
      baseAmount,
      basePrice: baseAmount,
      addonAmount,
      taxes: 0,
      discounts: 0,
      serviceCharges: 0,
      convenienceFees: 0,
      tokenAmount: Math.min(tokenAmount, grandTotal),
      remainingBalance: Math.max(0, grandTotal - tokenAmount),
      grandTotal,
      total: grandTotal,
      availability: tripData.availability || {},
      breakdown: [
        { id: "base", label: "Base Trip Price", amount: baseAmount },
        ...addonRows,
      ],
    };
    return res.status(200).json({ status: "success", component: { data: { pricing, addons: Object.values(TREVIO_ADDONS) } } });
  } catch (error) {
    console.error("getTrevioPricing error:", error);
    return res.status(500).json({ status: "error", message: "Failed to calculate trip pricing" });
  }
};

export const getTrevioAvailability = async (req, res) => {
  try {
    const trip = await trevioTripService.findBySlug(req.params.tripRef);
    if (!trip) return res.status(404).json({ status: "error", message: "Trip not found" });
    const normalized = trevioTripService.normalize(trip);
    return res.status(200).json({ status: "success", component: { data: { availability: normalized.availability || {} } } });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Failed to load seat availability" });
  }
};
