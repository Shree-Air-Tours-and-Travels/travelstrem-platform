import pageDefinitionService from "../../../services/pageDefinitionService.js";
import masterDataService from "../../masterData/services/masterDataService.js";
import trevioTripService from "../services/trevioTripService.js";
import { TREVIO_SEED_TRIPS } from "../data/seedTrips.js";

const TREVIO_HOME_PAGE = "trevio-remote/home";
const QUICK_CHIPS_KEY = "trevio.quickChipOptions";

const loadTrevioTrips = async (req) => {
  try {
    const result = await trevioTripService.listTrips({
      ...req.query,
      limit: req.query?.limit || 4,
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
        limit: 4,
        total: 0,
        totalPages: 1,
        hasMore: false,
      },
    };
  }
};

export const getTrevioHome = async (req, res) => {
  const page = pageDefinitionService.buildPageResponse(TREVIO_HOME_PAGE);
  const [quickChipOptions, tripResult] = await Promise.all([
    masterDataService.getOptionSet(QUICK_CHIPS_KEY),
    loadTrevioTrips(req),
  ]);
  const trips = tripResult.trips || [];
  const featuredTrip = trips.find((trip) => trip.featured) || trips[0] || null;
  const internationalTrips = TREVIO_SEED_TRIPS.filter(
    (trip) => trip.category === "international" && trip.isListed
  ).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).slice(0, 3);

  return res.status(200).json({
    ...page,
    component: {
      ...page.component,
      data: {
        ...page.component.data,
        state: {
          ...(page.component.data.state || {}),
          featuredTrip,
          adventureTrips: trips,
          tripPagination: tripResult.pagination,
          internationalTrips,
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
