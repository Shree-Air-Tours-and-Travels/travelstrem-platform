import trevioTripService from "../services/trevioTripService.js";

export const getInternationalTrips = async (req, res) => {
  try {
    const limit = parseInt(req.query?.limit, 10) || 3;
    const result = await trevioTripService.listInternationalTrips({ limit });

    return res.status(200).json({
      status: "success",
      data: {
        trips: result.trips,
        total: result.total,
      },
    });
  } catch (error) {
    console.error("[InternationalTripsController] Error:", error.message);
    return res.status(200).json({
      status: "success",
      data: { trips: [], total: 0 },
    });
  }
};
