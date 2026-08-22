/**
 * Server-managed agent/agency identity for builder-created tours.
 *
 * Deliberately dependency-free so it can be unit tested without pulling in
 * config/database modules.
 */

/** Fields derived from the acting agent's account/agency — clients can never set them. */
export const SERVER_IDENTITY_FIELDS = Object.freeze([
    "agentRef",
    "agencyRef",
    "partnerAgencyRef",
    "providerName",
]);

export const PLATFORM_PROVIDER_NAME = "TravelsTREM";

/**
 * Server-managed values for the current actor. Returns {} for platform-side
 * actors (e.g. master admin without an agency) so providerName stays editable.
 */
export const resolveAgencyIdentity = (req) => {
    const access = req?.access || {};
    const actor = access.user || req?.user || {};
    const agency = access.agency || null;
    if (!agency) return {};

    const role = access.role || actor.agencyRole;
    const isAgencyActor = actor.role === "agent" || ["partner_agent", "partner_admin"].includes(role);
    if (!isAgencyActor) return {};

    return {
        agentRef: actor.agentRef || "",
        agencyRef: actor.agencyRef || agency.partnerAgencyRef || "",
        partnerAgencyRef: actor.partnerAgencyRef || agency.partnerAgencyRef || "",
        providerName: agency.agencyName || "",
    };
};

/**
 * Force-stamps server-managed identity onto a tour document, ignoring whatever
 * the client sent — including explicit empty strings/nulls.
 */
export const applyIdentity = (target, identity) => {
    SERVER_IDENTITY_FIELDS.forEach((field) => {
        const value = identity[field];
        if (value !== undefined && value !== null && value !== "") target[field] = value;
    });
    return target;
};
