import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { searchToursFromRawRequest } from "../services/tourSearchService.js";
import masterDataService from "../../masterData/services/masterDataService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filterWidgetPath = path.resolve(
    __dirname,
    "../../../data/tours-remote/listing/widgets/tour-filters.json",
);

const asOptions = (items = []) =>
    items.map((item) => ({
        id: item.id,
        value: item.value,
        label: `${item.label} (${item.count})`,
        count: item.count,
    }));

// Legacy metadata endpoint retained for widget configuration consumers. All
// option values and counts now come from the MongoDB search aggregation.
export const getFilters = async (req, res) => {
    try {
        const [widget, result] = await Promise.all([
            fs.promises.readFile(filterWidgetPath, "utf8").then(JSON.parse),
            searchToursFromRawRequest({ page: 1, pageSize: 1 }),
        ]);
        const { facets, pagination } = result;
        return res.status(200).json({
            status: "success",
            message: "Tour filter metadata fetched",
            component: {
                data: {
                    summary: {
                        totalTours: pagination.totalItems,
                        priceRange: facets.price,
                        dayRange: { min: facets.duration.minDays, max: facets.duration.maxDays },
                    },
                    facets,
                },
                dataScope: {
                    options: {
                        originCityOptions: asOptions(facets.origins),
                        destinationCityOptions: asOptions(facets.destinations),
                        countryOptions: asOptions(facets.countries),
                        agencyOptions: asOptions(facets.agencies),
                        tags: asOptions(facets.tags),
                        featured: await masterDataService.getOptionSet(
                            "trevista.tourFeaturedOptions",
                        ),
                        priceRange: facets.price,
                        dayRange: { min: facets.duration.minDays, max: facets.duration.maxDays },
                    },
                },
                elements: widget.component.elements,
                structure: widget.component.structure,
            },
        });
    } catch (error) {
        console.error("getFilters error:", error);
        return res.status(500).json({
            status: "error",
            code: "TOUR_FILTERS_FAILED",
            message: "Tour filters could not be loaded",
        });
    }
};

export default { getFilters };
