import Tour from "../models/Tour.js";
import TourDeparture from "../models/TourDeparture.js";
import PartnerAgency from "../../auth/models/PartnerAgency.js";
import buildTourSearchPipeline from "../search/tourSearch.pipeline.js";

const TourSearchRepository = {
    async search(search) {
        const tenant = process.env.TENANT_CLIENT_ID
            ? await Tour.db.collection("tenantconfigurations").findOne(
                { _id: new Tour.db.base.Types.ObjectId(process.env.TENANT_CLIENT_ID), status: "active" },
                { projection: { partnerEnabled: 1 } },
            )
            : null;
        const pipeline = buildTourSearchPipeline(search, {
            departureCollection: TourDeparture.collection.name,
            agencyCollection: PartnerAgency.collection.name,
            includePartnerAgencies: !process.env.TENANT_CLIENT_ID || tenant?.partnerEnabled === true,
        });
        const [result = {}] = await Tour.aggregate(pipeline).allowDiskUse(true);
        return result;
    },
};

export default TourSearchRepository;
