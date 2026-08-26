import config from "../../../config/env.js";
import PartnerAgency from "../../auth/models/PartnerAgency.js";
import User from "../../auth/models/User.js";

const ACTIVE_USER = { accountStatus: "active" };

const findUser = (query) =>
    User.findOne({ ...query, ...ACTIVE_USER })
        .select("name email phone phoneNumber mobile agencyId agencyRole adminLevel")
        .lean();

const findUserById = (id) =>
    id
        ? User.findOne({ _id: id, ...ACTIVE_USER })
              .select("name email phone phoneNumber mobile agencyId agencyRole adminLevel")
              .lean()
        : null;

const findAgencyPartnerAdmin = async (agency) => {
    if (!agency?._id) return null;
    const contactEmail = String(agency.contactEmail || "")
        .trim()
        .toLowerCase();
    const query = {
        agencyId: agency._id,
        agencyRole: "partner_admin",
        ...ACTIVE_USER,
    };
    const selection = "name email phone phoneNumber mobile agencyId agencyRole adminLevel";
    if (contactEmail) {
        const primaryContact = await User.findOne({ ...query, email: contactEmail })
            .select(selection)
            .lean();
        if (primaryContact) return primaryContact;
    }
    return User.findOne(query).sort({ createdAt: 1, _id: 1 }).select(selection).lean();
};

const findMasterAdmin = async () =>
    (config.MASTER_ADMIN_EMAIL
        ? await findUser({
              email: String(config.MASTER_ADMIN_EMAIL).trim().toLowerCase(),
              role: "admin",
              adminLevel: "master",
          })
        : null) || (await findUser({ role: "admin", adminLevel: "master" }));

const assignment = ({ agent, agency, reason }) => ({
    agent: agent || null,
    agency: agency || null,
    agentId: agent?._id || null,
    agencyId: agency?._id || agent?.agencyId || null,
    recipientEmails: agent?.email ? [agent.email] : [],
    reason,
});

export const resolveCustomTourAssignment = async ({ sourceTour = null } = {}) => {
    if (sourceTour?._id) {
        const agency = sourceTour.agencyId
            ? await PartnerAgency.findOne({ _id: sourceTour.agencyId, status: "active" }).lean()
            : null;
        const directOwner = await findUserById(sourceTour.ownerAgent || sourceTour.createdBy);
        const owner =
            directOwner &&
            (!sourceTour.agencyId ||
                (agency && String(directOwner.agencyId) === String(sourceTour.agencyId)))
                ? directOwner
                : await findAgencyPartnerAdmin(agency);
        if (owner) return assignment({ agent: owner, agency, reason: "source_tour_owner" });
    }

    const partnerAgency = await PartnerAgency.findOne({
        customTourPartner: true,
        status: "active",
        productAccess: "trevista",
    }).lean();
    if (partnerAgency) {
        const partnerAdmin = await findAgencyPartnerAdmin(partnerAgency);
        if (partnerAdmin)
            return assignment({
                agent: partnerAdmin,
                agency: partnerAgency,
                reason: "custom_tour_partner",
            });
    }

    const masterAdmin = await findMasterAdmin();
    const fallback = assignment({
        agent: masterAdmin,
        agency: null,
        reason: "master_admin_fallback",
    });
    if (!fallback.recipientEmails.length && config.MASTER_ADMIN_EMAIL)
        fallback.recipientEmails.push(config.MASTER_ADMIN_EMAIL);
    return fallback;
};
