import mongoose from "mongoose";
import config from "../config/index.js";
import User from "../modules/auth/models/User.js";
import PartnerAgency from "../modules/auth/models/PartnerAgency.js";
import Tour from "../modules/tours/models/Tour.js";

const CATALOG = [
    {
        slug: "kerala-backwaters-and-hills",
        title: "Kerala Backwaters and Hills Escape",
        from: "Kochi",
        to: "Munnar",
        owner: "agent-1",
    },
    {
        slug: "goa-coast-and-heritage",
        title: "Goa Coast and Heritage Getaway",
        from: "Panaji",
        to: "South Goa",
        owner: "agent-1",
    },
    {
        slug: "varanasi-spiritual-discovery",
        title: "Varanasi Spiritual Discovery",
        from: "Varanasi",
        to: "Sarnath",
        owner: "agent-2",
    },
    {
        slug: "meghalaya-waterfalls-and-roots",
        title: "Meghalaya Waterfalls and Living Roots",
        from: "Shillong",
        to: "Cherrapunji",
        owner: "agent-2",
    },
    {
        slug: "kashmir-valleys-and-lakes",
        title: "Kashmir Valleys and Lakes Journey",
        from: "Srinagar",
        to: "Pahalgam",
        owner: "master",
    },
    {
        slug: "himachal-mountain-retreat",
        title: "Himachal Mountain Retreat",
        from: "Shimla",
        to: "Manali",
        owner: "master",
    },
    {
        slug: "andaman-island-discovery",
        title: "Andaman Island Discovery",
        from: "Port Blair",
        to: "Havelock Island",
        owner: "master",
    },
];

const clone = (value) => JSON.parse(JSON.stringify(value));
const destination = (name, order = 0) => {
    const id = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return {
        destinationId: id,
        name,
        cityId: id,
        cityName: name,
        countryId: "india",
        countryName: "India",
        sortOrder: order,
    };
};

const applyOwnership = (tour, ownerKey, { agents, agency, master }) => {
    if (ownerKey === "master") {
        Object.assign(tour, {
            agencyId: null,
            createdBy: master._id,
            ownerAgent: null,
            agentRef: "",
            agentTour: false,
            agencyRef: "",
            partnerAgencyRef: "",
            inventorySource: "platform",
            providerName: "TravelsTREM",
        });
        return;
    }

    const agent = agents[ownerKey === "agent-2" ? 1 : 0];
    Object.assign(tour, {
        agencyId: agency._id,
        createdBy: agent._id,
        ownerAgent: agent._id,
        agentRef: agent.agentRef,
        agentTour: true,
        agencyRef: agent.agencyRef || agency.partnerAgencyRef,
        partnerAgencyRef: agency.partnerAgencyRef,
        inventorySource: "agent",
        providerName: agency.agencyName,
    });
};

const run = async () => {
    await mongoose.connect(config.MONGO_URI);

    const [master, agents, agency, agentTemplate, platformTemplate] = await Promise.all([
        User.findOne({ adminLevel: "master", accountStatus: "active" }).lean(),
        User.find({
            role: "agent",
            agentApprovalStatus: "approved",
            accountStatus: "active",
            agencyId: { $ne: null },
        })
            .sort({ createdAt: 1 })
            .limit(2)
            .lean(),
        PartnerAgency.findOne({ status: { $in: ["active", "approved"] } }).lean(),
        Tour.findOne({ status: "published", agencyId: { $ne: null } }).lean(),
        Tour.findOne({ status: "published", inventorySource: "platform" }).lean(),
    ]);

    if (!master || agents.length < 2 || !agency || !agentTemplate || !platformTemplate) {
        throw new Error("Seeding requires one master admin, two approved agents, one active agency and published templates");
    }

    let created = 0;
    for (const item of CATALOG) {
        if (await Tour.exists({ slug: item.slug })) continue;

        const tour = clone(item.owner === "master" ? platformTemplate : agentTemplate);
        delete tour._id;
        delete tour.__v;
        delete tour.createdAt;
        delete tour.updatedAt;
        tour.slug = item.slug;
        tour.title = item.title;
        tour.shortDescription = `A thoughtfully planned journey from ${item.from} to ${item.to}.`;
        tour.city = { from: item.from, to: item.to };
        tour.address = { city: item.to, state: item.to, country: "India" };
        tour.primaryDestination = destination(item.to);
        tour.destinations = [destination(item.from), destination(item.to, 1)];
        tour.tags = [item.from, item.to, "India"];
        tour.tagIds = [
            item.from.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            item.to.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        ];
        tour.featured = item.owner === "master";
        tour.trending = item.owner === "agent-2";
        tour.status = "published";
        tour.isPublished = true;
        tour.visibility = "public";
        tour.archivedAt = null;
        tour.tremVerified = true;
        tour.tremVerifiedBy = master._id;
        tour.tremVerifiedAt = new Date();
        applyOwnership(tour, item.owner, { agents, agency, master });

        await Tour.create(tour);
        created += 1;
    }

    const total = await Tour.countDocuments({
        status: "published",
        visibility: "public",
        archivedAt: null,
    });
    console.log(JSON.stringify({ created, publishedPublicTours: total }));
};

run()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
