import config from "../../config/env.js";
import Favorite from "../tours/models/Favorite.js";
import Tour from "../tours/models/Tour.js";
import Trip from "../trips/models/Trip.js";
import Notification from "../tenancy/models/Notification.js";
import SupportTicket from "../support/models/SupportTicket.js";
import { customerScopeQuery } from "../tenancy/customerScope.js";
import ApiError from "../../shared/errors/ApiError.js";
import { resolveDashboardContext } from "./context.js";
import { overviewManifest } from "./overview.js";

const origins = {
    trehub: config.TREHUB_URL,
    trevista: config.TREVISTA_URL,
    trevio: config.TREVIO_URL,
};
const serviceIcons = {
    flights: "plane",
    hotels: "hotel",
    tours: "travelPackage",
    trips: "compass",
};

export const navigationFor = (context) => {
    const allowed = (permission) => context.permissions.includes(permission);
    const supportsWishlist = context.services.some((service) => ["tours", "trips"].includes(service));
    const pages = [["overview", "Overview", "home", "dashboard:view"]];
    if (allowed("booking:view") && context.accountModules.includes("bookings")) {
        if (context.services.length)
            pages.push(["bookings", "Bookings", "calendar", "booking:view"]);
        for (const { services = [], metadata } of context.productDefinitions) {
            for (const id of services) {
                if (
                    metadata?.dashboard?.modules?.[id] !== false &&
                    !pages.some(([key]) => key === id)
                )
                    pages.push([
                        id,
                        id.charAt(0).toUpperCase() + id.slice(1),
                        serviceIcons[id] || "calendar",
                        "booking:view",
                    ]);
            }
        }
    }
    pages.push(
        ["wishlist", "Wishlist", "heart", "wishlist:view"],
        ["profile", "Profile", "user", "profile:view"],
        ["notifications", "Notifications", "bell", "notifications:view"],
        ["support", "Support", "support", "support:view"],
    );
    return pages
        .filter(
            ([id, , , permission]) =>
                allowed(permission) &&
                (id !== "wishlist" || supportsWishlist) &&
                (id === "overview" ||
                    context.services.includes(id) ||
                    context.accountModules.includes(id)),
        )
        .map(([id, label, icon]) => ({
            id,
            label,
            icon,
            parentId: context.services.includes(id) ? "bookings" : null,
            href: `/dashboard/${id}`,
        }));
};

export async function buildDashboardHome(access, originProduct = "") {
    const context = await resolveDashboardContext(access, originProduct);
    const { branding, productDefinitions, ...publicContext } = context;
    const source = productDefinitions.find(({ key }) => key === originProduct);
    const navigation = navigationFor(context);
    return {
        context: publicContext,
        branding,
        actions: {
            signOut: { id: "logout", label: "Sign out", icon: "logout", action: "logout" },
            theme: { enabled: context.theme.allowSwitching !== false, darkLabel: "Switch to dark mode", lightLabel: "Switch to light mode", darkIcon: "moon", lightIcon: "sun" },
        },
        navigation,
        origin: {
            product: source?.key || "",
            label: process.env.TENANT_CLIENT_ID ? context.tenantName : source?.name || "App shell",
            href: source ? origins[source.key] || config.SHELL_URL : config.SHELL_URL,
            defaultPage: source
                ? source.services?.find((id) => navigation.some((item) => item.id === id)) ||
                  "overview"
                : "overview",
        },
        user: {
            name: access.user.name || access.user.email || "",
            avatar: access.user.avatar || "",
        },
        copy: {
            title: "Dashboard",
            accountTitle: "Account",
            sessionTitle: "Session",
            emptyTitle: "Nothing here yet",
            emptyDescription: "Your activity will appear here when it is available.",
        },
    };
}

export async function buildDashboardPage(access, section, originProduct = "") {
    const context = await resolveDashboardContext(access, originProduct);
    if (!navigationFor(context).some((item) => item.id === section))
        throw new ApiError(403, "This dashboard page is not available to your account.");
    const scope = customerScopeQuery(context);
    const owner = context.userId;
    if (section === "overview")
        return overviewManifest(context, navigationFor(context), access.user);
    if (section === "profile")
        return {
            title: "Profile",
            user: {
                name: access.user.name,
                email: access.user.email,
                phone: access.user.phone || access.user.mobile,
                avatar: access.user.avatar,
                createdAt: access.user.createdAt,
            },
        };
    if (section === "notifications") {
        const records = await Notification.find({ ...scope, userId: owner, portal: "customer" })
            .select("title message readAt createdAt")
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        return {
            title: "Notifications",
            emptyTitle: "You're all caught up",
            emptyDescription: "Booking updates and account notifications will appear here.",
            items: records.map(({ _id, ...item }) => ({ id: String(_id), ...item })),
        };
    }
    if (section === "support") {
        const records = await SupportTicket.find({ ...scope, user: owner })
            .select("reference subject status lastActivityAt")
            .sort({ lastActivityAt: -1 })
            .limit(50)
            .lean();
        return {
            title: "Your support requests",
            emptyTitle: "No support requests yet",
            emptyDescription:
                "Need help with a journey? Create a request and follow its progress here.",
            action: { label: "Create a support request", href: "/help/new-request" },
            items: records.map((item) => ({
                id: String(item._id),
                title: item.subject,
                reference: item.reference,
                status: item.status,
                href: `/help/requests/${item._id}`,
            })),
        };
    }
    if (section === "wishlist") {
        const favorites = await Favorite.find({
            ...scope,
            userId: owner,
            product: { $in: context.products },
        })
            .select("tourId product createdAt")
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        const [tours, trips] = await Promise.all([
            Tour.find({
                _id: {
                    $in: favorites
                        .filter((item) => item.product !== "trevio")
                        .map((item) => item.tourId),
                },
            })
                .select("title name slug")
                .lean(),
            Trip.find({
                _id: {
                    $in: favorites
                        .filter((item) => item.product === "trevio")
                        .map((item) => item.tourId),
                },
            })
                .select("title name slug")
                .lean(),
        ]);
        const byId = new Map([...tours, ...trips].map((item) => [String(item._id), item]));
        return {
            title: "Saved journeys",
            emptyTitle: "Your wishlist is empty",
            emptyDescription: "Save journeys while you explore to find them here later.",
            items: favorites.map((item) => {
                const journey = byId.get(String(item.tourId));
                const base = origins[item.product];
                const path = item.product === "trevio" ? "/trips/" : "/trevista/tours/";
                return {
                    id: String(item._id),
                    title: journey?.title || journey?.name || "Saved journey",
                    href:
                        journey && base
                            ? new URL(
                                  `${path}${encodeURIComponent(journey.slug || journey._id)}`,
                                  base,
                              ).toString()
                            : "",
                };
            }),
        };
    }
    throw new ApiError(404, "Dashboard page not found.");
}
