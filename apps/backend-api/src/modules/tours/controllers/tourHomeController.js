import pageDefinitionService from "../../../services/pageDefinitionService.js";

const TOUR_HOME_PAGE = "trevista-remote/home";

export const getTourHome = async (req, res) => {
    try {
        const page = pageDefinitionService.buildPageResponse(TOUR_HOME_PAGE);

        return res.status(200).json({
            ...page,
            message: "Trevista home fetched successfully",
        });
    } catch (error) {
        console.error("[TourHomeController] Failed to load home:", error.message);
        return res.status(200).json({
            status: "success",
            component: {
                data: { state: {} },
                dataScope: { options: {} },
                elements: { labels: {}, urls: {} },
                structure: { header: {}, widgets: [], config: {}, actions: [] },
            },
            message: "Trevista home fallback",
        });
    }
};
