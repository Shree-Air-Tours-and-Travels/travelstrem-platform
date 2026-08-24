const safeCount = (value) => Math.max(0, Number(value) || 0);
const safeDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
};
const idOf = (value) => String(value?._id || value?.id || "");

export function partnerDashboardScopes(access) {
    const agencyId = access.agencyId;
    const ownerAgent = access.role === "partner_agent" ? access.user._id : null;
    return {
        products: ownerAgent ? { agencyId, ownerAgent } : { agencyId },
        customers: ownerAgent
            ? { agencyId, ownerAgent, deletedAt: null }
            : { agencyId, deletedAt: null },
        enquiries: ownerAgent ? { agencyId, ownerAgent } : { agencyId },
        audit: ownerAgent ? { agencyId, actorId: ownerAgent } : { agencyId },
    };
}

const productTarget = (key) =>
    key === "trevio" ? "/agent/trevio/trips" : "/agent/services/tours";

const activityTarget = (item) => {
    if (item.kind === "enquiry") return "/agent/bookings";
    if (item.kind === "customer") return "/agent/customers";
    if (item.product) return productTarget(item.product);
    return "/agent/dashboard";
};

export function buildPartnerDashboard({
    access,
    counts,
    records,
    activityPagination = {},
    generatedAt = new Date(),
}) {
    const isAdmin = access.role === "partner_admin";
    const agency = access.agency || {};
    const user = access.user || {};
    const assignedProducts = isAdmin
        ? agency.productAccess
        : user.productAccess?.length
          ? user.productAccess
          : agency.productAccess;
    const productAccess = [
        ...new Set((assignedProducts?.length ? assignedProducts : ["trevista"]).map((key) =>
            String(key).toLowerCase(),
        )),
    ];
    const trevista = counts.trevista || {};
    const trevio = counts.trevio || {};
    const visibleProductCounts = [
        ...(productAccess.includes("trevista") ? [trevista] : []),
        ...(productAccess.includes("trevio") ? [trevio] : []),
    ];
    const countVisible = (field) =>
        visibleProductCounts.reduce((total, product) => total + safeCount(product[field]), 0);
    const totalProducts = countVisible("total");
    const publishedProducts = countVisible("published");
    const draftProducts = countVisible("draft");
    const pendingProducts = countVisible("pending");
    const openEnquiries = safeCount(counts.enquiries?.new) + safeCount(counts.enquiries?.inReview);

    const products = [
        {
            key: "trevista",
            label: "Trevista Tours",
            description: "Customisable tour inventory and traveller enquiries.",
            icon: "map",
            total: safeCount(trevista.total),
            published: safeCount(trevista.published),
            draft: safeCount(trevista.draft),
            pending: safeCount(trevista.pending),
            upcoming: safeCount(trevista.upcoming),
            target: productTarget("trevista"),
        },
        {
            key: "trevio",
            label: "Trevio Trips",
            description: "Fixed departures, availability and trip operations.",
            icon: "calendar",
            total: safeCount(trevio.total),
            published: safeCount(trevio.published),
            draft: safeCount(trevio.draft),
            pending: safeCount(trevio.pending),
            upcoming: safeCount(trevio.upcoming),
            target: productTarget("trevio"),
        },
    ].filter((product) => productAccess.includes(product.key));

    const activityLimit = Math.max(1, Number(activityPagination.limit) || 6);
    const requestedActivityPage = Math.max(1, Number(activityPagination.page) || 1);
    const allActivities = [
        ...(records.enquiries || []).map((item) => ({
            id: `enquiry-${idOf(item)}`,
            kind: "enquiry",
            icon: "messageCircle",
            title: item.tourTitle || "General travel enquiry",
            description: item.fields?.name
                ? `Enquiry from ${item.fields.name}`
                : "A traveller enquiry needs attention.",
            status: item.status || "new",
            occurredAt: safeDate(item.updatedAt || item.createdAt),
            target: "/agent/bookings",
        })),
        ...(records.products || []).map((item) => ({
            id: `${item.product || "product"}-${idOf(item)}`,
            kind: "product",
            product: item.product,
            icon: item.product === "trevio" ? "calendar" : "map",
            title: item.title || "Untitled travel product",
            description: `${item.product === "trevio" ? "Trevio trip" : "Trevista tour"} was updated.`,
            status: item.status || "draft",
            occurredAt: safeDate(item.updatedAt || item.createdAt),
            target: productTarget(item.product),
        })),
        ...(records.customers || []).map((item) => ({
            id: `customer-${idOf(item)}`,
            kind: "customer",
            icon: "user",
            title: item.name || "Agency customer",
            description: "Customer record was updated.",
            status: item.status || "active",
            occurredAt: safeDate(item.updatedAt || item.createdAt),
            target: "/agent/customers",
        })),
    ]
        .filter((item) => item.occurredAt)
        .sort((left, right) => new Date(right.occurredAt) - new Date(left.occurredAt));
    const activityTotal = Number.isFinite(Number(activityPagination.total))
        ? safeCount(activityPagination.total)
        : allActivities.length;
    const activityTotalPages = Math.max(1, Math.ceil(activityTotal / activityLimit));
    const activityPage = Math.min(requestedActivityPage, activityTotalPages);
    const activityOffset = (activityPage - 1) * activityLimit;
    const activities = allActivities
        .slice(activityOffset, activityOffset + activityLimit)
        .map((item) => ({ ...item, target: activityTarget(item) }));

    return {
        schemaVersion: "partner-dashboard.v1",
        scope: isAdmin ? "agency" : "agent",
        generatedAt: safeDate(generatedAt),
        viewer: {
            role: access.role,
            roleLabel: isAdmin ? "Partner Admin" : "Partner Agent",
            name: user.name || "Partner",
        },
        agency: {
            id: idOf(agency),
            name: agency.agencyName || "Partner agency",
            status: agency.status || "active",
            currency: agency.settings?.currency || "INR",
            timezone: agency.settings?.timezone || "Asia/Kolkata",
            productAccess,
        },
        hero: {
            eyebrow: isAdmin ? "Agency operations" : "My operations",
            title: isAdmin ? "Agency dashboard" : "Agent dashboard",
            description: isAdmin
                ? "Monitor your team, products, customers and traveller enquiries from one workspace."
                : "Stay on top of your assigned products, customers and traveller enquiries.",
        },
        kpiAriaLabel: "Operational summary",
        kpis: [
            isAdmin
                ? {
                      id: "active-agents",
                      label: "Active agents",
                      value: safeCount(counts.agents?.active),
                      helper: `${safeCount(counts.agents?.inactive)} inactive or pending`,
                      icon: "usersRound",
                      tone: "primary",
                      target: "/agent/agency?view=team",
                  }
                : {
                      id: "my-products",
                      label: "My products",
                      value: totalProducts,
                      helper: `${pendingProducts} awaiting approval`,
                      icon: "map",
                      tone: "primary",
                      target: products[0]?.target || "/agent/dashboard",
                  },
            {
                id: "customers",
                label: isAdmin ? "Agency customers" : "My customers",
                value: safeCount(counts.customers?.total),
                helper: `${safeCount(counts.customers?.active)} active`,
                icon: "user",
                tone: "info",
                target: "/agent/customers",
            },
            {
                id: "published-products",
                label: "Published products",
                value: publishedProducts,
                helper: `${draftProducts} drafts in progress`,
                icon: "shieldCheck",
                tone: "success",
                target: products[0]?.target || "/agent/dashboard",
            },
            {
                id: "open-enquiries",
                label: "Open enquiries",
                value: openEnquiries,
                helper: `${safeCount(counts.enquiries?.new)} new`,
                icon: "messageCircle",
                tone: openEnquiries ? "warning" : "neutral",
                target: "/agent/bookings",
            },
        ],
        workload: [
            {
                id: "new-enquiries",
                label: "New enquiries",
                value: safeCount(counts.enquiries?.new),
                description: "Traveller requests waiting for a first response.",
                status: safeCount(counts.enquiries?.new) ? "attention" : "clear",
                icon: "messageCircle",
                target: "/agent/bookings",
            },
            {
                id: "in-review",
                label: "Enquiries in review",
                value: safeCount(counts.enquiries?.inReview),
                description: "Quotes or follow-ups currently being prepared.",
                status: safeCount(counts.enquiries?.inReview) ? "in_progress" : "clear",
                icon: "clock",
                target: "/agent/bookings",
            },
            {
                id: "pending-products",
                label: "Pending approval",
                value: pendingProducts,
                description: "Travel products submitted for publishing review.",
                status: pendingProducts ? "pending_approval" : "clear",
                icon: "shieldCheck",
                target: products[0]?.target || "/agent/dashboard",
            },
            {
                id: "unread-alerts",
                label: "Unread alerts",
                value: safeCount(counts.notifications?.unread),
                description: "Workspace notifications that have not been opened.",
                status: safeCount(counts.notifications?.unread) ? "new" : "clear",
                icon: "bell",
                target: "/agent/notifications",
            },
        ],
        products,
        quickActions: [
            {
                id: "review-enquiries",
                label: "Review enquiries",
                description: "Respond to traveller requests and prepare quotes.",
                icon: "messageCircle",
                target: "/agent/bookings",
                variant: "primary",
            },
            {
                id: "manage-products",
                label: "Manage travel products",
                description: "Create, update and publish your available inventory.",
                icon: "map",
                target: products[0]?.target || "/agent/services/tours",
                variant: "secondary",
            },
            ...(isAdmin
                ? [{
                      id: "manage-team",
                      label: "Manage agency team",
                      description: "Invite agents and manage workspace access.",
                      icon: "usersRound",
                      target: "/agent/agency?view=team",
                      variant: "secondary",
                  }]
                : []),
            {
                id: "view-customers",
                label: "View customers",
                description: "Open your tenant-isolated customer directory.",
                icon: "user",
                target: "/agent/customers",
                variant: "secondary",
            },
        ],
        recentActivity: activities,
        recentActivityPagination: {
            page: activityPage,
            limit: activityLimit,
            total: activityTotal,
            totalPages: activityTotalPages,
            hasPrevious: activityPage > 1,
            hasNext: activityOffset + activities.length < activityTotal,
        },
    };
}
