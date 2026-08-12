import Tour from "../models/Tour.js";
import TourDeparture from "../models/TourDeparture.js";
import PartnerAgency from "../../auth/models/PartnerAgency.js";
import buildTourSearchPipeline from "../search/tourSearch.pipeline.js";

const TourSearchRepository = {
  async search(search) {
    const pipeline = buildTourSearchPipeline(search, {
      departureCollection: TourDeparture.collection.name,
      agencyCollection: PartnerAgency.collection.name,
    });
    const [result = {}] = await Tour.aggregate(pipeline).allowDiskUse(true);
    return result;
  },
};

export default TourSearchRepository;
