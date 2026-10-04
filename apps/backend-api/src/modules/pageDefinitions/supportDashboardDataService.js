import SupportTicket from "../support/models/SupportTicket.js";

export async function buildSupportDashboardSnapshot(user) {
    const isAdmin = user.role === "admin";
    const scope = isAdmin ? {} : { assignedAdmin: user._id };
    const openQuery = { ...scope, status: { $nin: ["RESOLVED", "CLOSED"] } };
    const [open, awaiting, recent] = await Promise.all([
        SupportTicket.countDocuments(openQuery),
        SupportTicket.countDocuments({ ...scope, status: "AWAITING_SUPPORT" }),
        SupportTicket.find(scope)
            .select("reference subject status lastActivityAt")
            .sort({ lastActivityAt: -1 })
            .limit(6)
            .lean(),
    ]);
    return {
        schemaVersion: "dashboard.v1",
        scope: isAdmin ? "support" : "assigned-support",
        viewer: { role: isAdmin ? "support_admin" : "support_agent", roleLabel: isAdmin ? "Support Admin" : "Support Agent", name: user.name },
        hero: {
            eyebrow: "Support desk",
            title: isAdmin ? "Support operations" : "My assigned tickets",
            description: isAdmin ? "Monitor support requests across the platform." : "Follow up on tickets assigned to you.",
        },
        kpiAriaLabel: "Support summary",
        kpis: [
            { id: "open", label: "Open tickets", value: open, icon: "support", target: "support" },
            { id: "awaiting", label: "Awaiting support", value: awaiting, icon: "clock", target: "support" },
        ],
        products: [],
        workload: [],
        recentActivity: recent.map((ticket) => ({
            id: String(ticket._id),
            title: ticket.subject || ticket.reference,
            description: ticket.reference,
            status: ticket.status,
            occurredAt: ticket.lastActivityAt,
            icon: "support",
            target: "support",
        })),
        quickActions: [],
    };
}
