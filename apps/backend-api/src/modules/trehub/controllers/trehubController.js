import pageDefinitionService from "../../../services/pageDefinitionService.js";
import Client from "../../clients/models/Client.js";

const TREHUB_HOME_PAGE = "trehub-remote/home";
const TREHUB_FLIGHT_LIST_PAGE = "trehub-remote/flights/flight-list";
const TREHUB_FLIGHT_JOURNEY_PAGE = "trehub-remote/flights/flight-journey";

export const getTrehubHome = async (req, res) => {
    const [activeClientCount, activeClients] = await Promise.all([
        Client.countDocuments({ status: "active" }),
        Client.find({ status: "active" })
            .select("name slug globalBrand")
            .sort({ name: 1 })
            .limit(8)
            .lean(),
    ]);
    const page = pageDefinitionService.buildPageResponse(TREHUB_HOME_PAGE, {
        injectData: {
            activeClientCount,
            activeClients: activeClients.map((client) => ({
                id: client.slug,
                name: client.globalBrand?.label || client.name,
                logo: client.globalBrand?.logoSrc
                    ? { src: client.globalBrand.logoSrc, alt: client.globalBrand.label || client.name }
                    : undefined,
            })),
        },
    });

    return res.status(200).json({
        ...page,
        message: "Trehub home fetched successfully",
    });
};

export const getTrehubFlights = async (req, res) => {
    const page = pageDefinitionService.buildPageResponse(TREHUB_FLIGHT_LIST_PAGE);
    page.component.data = {};

    return res.status(200).json({
        ...page,
        message: "Trehub flights fetched successfully",
    });
};

export const getTrehubFlightJourney = async (_req, res) => res.status(200).json({
    ...pageDefinitionService.buildPageResponse(TREHUB_FLIGHT_JOURNEY_PAGE),
    message: "Trehub flight journey fetched successfully",
});
