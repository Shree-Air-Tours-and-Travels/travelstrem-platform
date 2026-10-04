import pageDefinitionService from "../../../services/pageDefinitionService.js";
import { getConfiguredHotelProviderNames } from "../../hotels/providers/hotel-provider.factory.js";
import { getConfiguredFlightProviderName } from "../../flights/providers/flight-provider.factory.js";

const TREHUB_HOME_PAGE = "trehub-remote/home";
const TREHUB_FLIGHT_LIST_PAGE = "trehub-remote/flights/flight-list";
const TREHUB_FLIGHT_JOURNEY_PAGE = "trehub-remote/flights/flight-journey";

export const getTrehubHome = async (req, res) => {
    const displayNames = { hotelbeds: "Hotelbeds", stayingapi: "StayingAPI", trekko: "Trekko" };
    const enabledServices = req.tenant?.client?.modules?.trehub;
    const allows = (service) => !Array.isArray(enabledServices) || enabledServices.includes(service);
    const providers = [
        ...(allows("hotels") ? getConfiguredHotelProviderNames().map((id) => ({ id, service: "Hotels" })) : []),
        ...(allows("flights") ? [{ id: getConfiguredFlightProviderName(), service: "Flights" }] : []),
    ].filter(({ id }) => id && id !== "mock");
    const configuredProviders = [
        ...new Map(
            providers.map(({ id, service }) => [
                `${service}:${id}`,
                { id: `${service}:${id}`, name: `${displayNames[id] || id} · ${service}` },
            ]),
        ).values(),
    ];
    const page = pageDefinitionService.buildPageResponse(TREHUB_HOME_PAGE, {
        injectData: {
            providerCount: configuredProviders.length,
            providers: configuredProviders,
        },
    });

    if (req.tenant?.client) {
        const client = req.tenant.client;
        const name = client.globalBrand?.label || client.name;
        Object.assign(page.component.elements.labels, {
            searchEyebrow: "Plan your next journey",
            searchTitle: "Welcome to",
            searchTitleAccent: name,
            searchDescription: "Find flights and stays for your next journey.",
            searchTypeAriaLabel: "Travel services",
            searchTrustSupport: "Help with your journey",
            whyEyebrow: "Why Us?",
            whyTitle: "Travel planning, made simple",
            whyDescription: `Plan your journey with ${name}, from your first search to your next stay.`,
            whySupportDescription:
                "Contact our team for help with your travel plans and reservations.",
            providerShowcaseEyebrow: "Travel options",
            providerShowcaseDescription: "Explore available flights and places to stay.",
        });
        page.component.structure.widgets = page.component.structure.widgets.filter(
            (widget) => widget.type !== "ClientShowcase",
        );
    }
    return res.status(200).json({
        ...page,
        message: "Home fetched successfully",
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

export const getTrehubFlightJourney = async (_req, res) =>
    res.status(200).json({
        ...pageDefinitionService.buildPageResponse(TREHUB_FLIGHT_JOURNEY_PAGE),
        message: "Trehub flight journey fetched successfully",
    });
