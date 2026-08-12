import { getTourDiscovery, searchTours, searchToursFromRawRequest } from "../services/tourSearchService.js";

const successResponse = (data, message) => ({
  status: "success",
  message,
  ...data,
  component: {
    data,
    dataScope: { options: {} },
    elements: { labels: {}, urls: {} },
    structure: { header: {}, widgets: [], config: {}, actions: [] },
  },
});

export const postTourSearch = async (req, res) => {
  try {
    const result = await searchTours(req.tourSearch);
    return res.status(200).json(successResponse(result, `${result.pagination.totalItems} tours matched`));
  } catch (error) {
    console.error("postTourSearch error:", error);
    return res.status(500).json({ status: "error", code: "TOUR_SEARCH_FAILED", message: "Tours could not be searched" });
  }
};

export const postLegacyTourSearch = async (req, res) => {
  try {
    const result = await searchToursFromRawRequest(req.body || {});
    return res.status(200).json(successResponse({
      ...result,
      tours: result.items,
      pagination: {
        ...result.pagination,
        limit: result.pagination.pageSize,
        total: result.pagination.totalItems,
        hasMore: result.pagination.hasNext,
      },
    }, `${result.pagination.totalItems} tours matched`));
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      status: "error",
      code: error.code || "TOUR_SEARCH_FAILED",
      message: status === 400 ? error.message : "Tours could not be searched",
      errors: error.details || undefined,
    });
  }
};

export const getTourDiscoveryController = async (req, res) => {
  try {
    const result = await getTourDiscovery();
    return res.status(200).json(successResponse(result, "Tour discovery fetched"));
  } catch (error) {
    console.error("getTourDiscovery error:", error);
    return res.status(500).json({ status: "error", code: "TOUR_DISCOVERY_FAILED", message: "Tour discovery could not be loaded" });
  }
};

