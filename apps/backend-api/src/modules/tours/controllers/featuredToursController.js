import pageDefinitionService from "../../../services/pageDefinitionService.js";

export const getFeaturedTours = async (req, res) => {
    try {
        const response = pageDefinitionService.buildWidgetResponse("customer-shell/home", "./widgets/featured-tours.json", {});

        return res.status(200).json({
            ...response,
            message: "Featured tours widget fetched successfully",
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            message: "Failed to fetch featured tours widget",
            error: err.message,
        });
    }
};
