import ContactLeadRepository from "../forms/repositories/ContactLeadRepository.js";
import User from "../auth/models/User.js";
import { enquiryView } from "../forms/mappers/enquiryView.js";

// Builds the user-specific payload injected into the app-shell dashboard
// page (metrics + recent bookings & enquiries). Enquiries are the
// customer-facing booking pipeline today, so those sections derive from
// ContactLeads that belong to the viewer (claimed or matched by email).
//
// NOTE: upcomingTrips intentionally stays EMPTY. A trip only becomes
// "upcoming" after the traveller accepts a quote AND completes payment —
// that journey is not built yet, so the UI must keep showing the no-data
// state until it ships.

const AWAITING_STATUSES = ["new", "in_review"];
const RECENT_LIMIT = 5;

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const identityQuery = async (userId) => {
    const identities = [{ claimedBy: userId }];
    try {
        const viewer = await User.findById(userId).select("email").lean();
        const email = String(viewer?.email || "").trim();
        if (email) {
            identities.push({
                claimedBy: null,
                "fields.email": { $regex: `^${escapeRegex(email)}$`, $options: "i" },
            });
        }
    } catch {
        // Email lookup is best-effort; claimed enquiries still resolve.
    }
    return identities.length === 1 ? identities[0] : { $or: identities };
};

const emptySnapshot = () => ({
    metrics: { totalEnquiries: 0, upcomingTrips: 0, awaitingResponse: 0 },
    recentActivity: [],
    upcomingTrips: [],
});

// Resolves to the injectData payload for the dashboard page. Never throws:
// a data failure must not take down the page definition.
export const buildDashboardSnapshot = async (userId) => {
    if (!userId) return emptySnapshot();
    try {
        const query = await identityQuery(userId);
        const [totalEnquiries, awaitingResponse, recentLeads] = await Promise.all([
            (async () => ContactLeadRepository.countDocuments(query))(),
            (async () =>
                ContactLeadRepository.countDocuments({
                    ...query,
                    status: { $in: AWAITING_STATUSES },
                }))(),
            (async () =>
                ContactLeadRepository.find(query)
                    .sort({ createdAt: -1 })
                    .limit(RECENT_LIMIT)
                    .lean())(),
        ]);

        return {
            metrics: {
                totalEnquiries,
                // Stays 0 until the quote-acceptance + payment journey exists.
                upcomingTrips: 0,
                awaitingResponse,
            },
            recentActivity: recentLeads.map((lead) => enquiryView(lead, "sent")),
            upcomingTrips: [],
        };
    } catch (err) {
        console.error("[Dashboard] snapshot build failed:", err?.message || err);
        return emptySnapshot();
    }
};

export default { buildDashboardSnapshot };
