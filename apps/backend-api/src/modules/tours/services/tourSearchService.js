import TourDiscoveryChip from "../models/TourDiscoveryChip.js";
import TourSearchRepository from "../repositories/TourSearchRepository.js";
import { mapTourSearchResult, slugifyTourSearchValue } from "../search/tourSearch.mapper.js";
import { normalizeTourSearchRequest } from "../validators/search.validation.js";
import masterDataService from "../../masterData/services/masterDataService.js";

const DISCOVERY_TYPES = new Set(["ALL", "TAG", "FEATURED"]);

const nowActiveChipQuery = (now = new Date()) => ({
  active: true,
  $and: [
    { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
    { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
  ],
});

const mapConfiguredChip = (chip) => ({
  id: String(chip._id),
  label: chip.label,
  slug: chip.slug,
  type: chip.chipType,
  value: chip.referenceId || null,
  icon: chip.icon || "",
});

const mapMasterChip = (option) => {
  const type = String(option.type || "TAG").toUpperCase();
  const rawValue = option.filterValue ?? option.value;
  return {
    id: option.id || option.value,
    label: option.label || option.title || option.value,
    slug: slugifyTourSearchValue(option.value),
    type,
    value: type === "ALL" ? null : rawValue,
    icon: option.icon || "",
  };
};

export const searchTours = async (search) => {
  const aggregation = await TourSearchRepository.search(search);
  return mapTourSearchResult(aggregation, search);
};

export const searchToursFromRawRequest = async (body) => {
  const normalized = normalizeTourSearchRequest(body);
  if (!normalized.ok) {
    const error = new Error("Invalid tour search request");
    error.status = 400;
    error.code = "INVALID_TOUR_SEARCH";
    error.details = normalized.errors;
    throw error;
  }
  return searchTours(normalized.value);
};

export const getTourDiscovery = async () => {
  const configured = await TourDiscoveryChip.find(nowActiveChipQuery()).sort({ priority: -1, label: 1 }).lean();
  const configuredChips = configured
    .filter((chip) => DISCOVERY_TYPES.has(chip.chipType))
    .map(mapConfiguredChip);
  if (configuredChips.length) {
    const withoutAll = configuredChips.filter((chip) => chip.type !== "ALL");
    const all = configuredChips.find((chip) => chip.type === "ALL")
      || { id: "all", label: "All tours", slug: "all", type: "ALL", value: null };
    return { chips: [all, ...withoutAll] };
  }

  const masterOptions = await masterDataService.getOptionSet("trevista.discoveryChipOptions");
  return { chips: masterOptions.map(mapMasterChip).filter((chip) => DISCOVERY_TYPES.has(chip.type)) };
};

export default { searchTours, searchToursFromRawRequest, getTourDiscovery };
