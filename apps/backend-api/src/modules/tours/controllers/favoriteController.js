import Favorite from "../models/Favorite.js";
import Tour from "../models/Tour.js";

export const toggleFavorite = async (req, res) => {
  try {
    const { tourId } = req.body;
    const userId = req.headers["x-user-id"] || "anonymous";

    if (!tourId) {
      return res.status(400).json({ status: "error", message: "tourId is required" });
    }

    const existing = await Favorite.findOne({ tourId, userId });

    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      return res.status(200).json({ status: "success", data: { favorited: false } });
    }

    await Favorite.create({ tourId, userId });
    return res.status(200).json({ status: "success", data: { favorited: true } });
  } catch (error) {
    console.error("toggleFavorite error:", error);
    return res.status(500).json({ status: "error", message: "Failed to toggle favorite" });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || "anonymous";
    const favorites = await Favorite.find({ userId }).sort({ createdAt: -1 }).lean();
    const tourIds = favorites.map((f) => f.tourId);
    const tours = await Tour.find({ _id: { $in: tourIds } });

    const ordered = tourIds
      .map((id) => tours.find((t) => String(t._id) === String(id)))
      .filter(Boolean)
      .map((doc) => doc.toObject({ virtuals: true }));

    return res.status(200).json({
      status: "success",
      componentData: {
        data: ordered,
        structure: {
          widgets: [
            {
              type: "favorites",
              props: {
                chips: [
                  { id: "tours", label: "Tours", active: true },
                  { id: "flights", label: "Flights", disabled: true },
                  { id: "hotels", label: "Hotels", disabled: true },
                  { id: "experiences", label: "Experiences", disabled: true },
                  { id: "visa", label: "Visa", disabled: true },
                ],
              },
            },
          ],
        },
        config: {},
      },
      message: "Favorites fetched successfully",
    });
  } catch (error) {
    console.error("getFavorites error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to get favorites",
      componentData: { data: [], structure: { widgets: [] }, config: {} },
    });
  }
};
