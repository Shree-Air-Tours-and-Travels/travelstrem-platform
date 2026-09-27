import Client from "../clients/models/Client.js";
import User from "../auth/models/User.js";

// Client dashboards derive their scope from the authenticated user record.
// Product and booking records are intentionally omitted until they carry a
// verified clientId; unscoped platform totals must never be reused here.
export async function buildClientDashboardSnapshot(userId, tokenVersion) {
    const user = await User.findById(userId)
        .select("name clientId clientRole accountStatus tokenVersion")
        .lean();
    if (
        !user ||
        (user.accountStatus || "active") !== "active" ||
        Number(tokenVersion || 0) !== Number(user.tokenVersion || 0) ||
        !user.clientId ||
        !["client_admin", "client_agent"].includes(user.clientRole)
    )
        return null;

    const client = await Client.findOne({ _id: user.clientId, status: "active" })
        .select("name status")
        .lean();
    if (!client) return null;

    const isAdmin = user.clientRole === "client_admin";
    const teamScope = {
        clientId: client._id,
        clientRole: { $in: ["client_admin", "client_agent"] },
    };
    const [totalMembers, activeMembers] = isAdmin
        ? await Promise.all([
              User.countDocuments(teamScope),
              User.countDocuments({ ...teamScope, accountStatus: "active" }),
          ])
        : [null, null];

    return {
        schemaVersion: "dashboard.v1",
        scope: isAdmin ? "client" : "client-agent",
        client: { id: String(client._id), name: client.name },
        viewer: {
            role: user.clientRole,
            roleLabel: isAdmin ? "Client Admin" : "Client Agent",
            name: user.name,
        },
        hero: {
            eyebrow: isAdmin ? "Client control center" : "My workspace",
            title: `${client.name} dashboard`,
            description: isAdmin
                ? "Your team and connected operations in one workspace."
                : "Your work inside your client's workspace.",
        },
        kpiAriaLabel: "Client overview",
        kpis: isAdmin
            ? [
                  { id: "team", label: "Team members", value: totalMembers, icon: "usersRound" },
                  {
                      id: "active-team",
                      label: "Active members",
                      value: activeMembers,
                      icon: "shieldCheck",
                  },
              ]
            : [],
        products: [],
        workload: [],
        recentActivity: [],
        quickActions: [],
    };
}
