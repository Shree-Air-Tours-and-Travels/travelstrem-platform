export const INTEGRATION_CAPABILITIES = Object.freeze([
    "travel.flights",
    "travel.hotels",
    "travel.tours",
    "payments",
    "storage.documents",
    "notifications.email",
]);

export const INTEGRATION_OWNERS = Object.freeze(["travelstrem", "tenant"]);
export const INTEGRATION_ENTRY_STATUSES = Object.freeze([
    "draft",
    "validated",
    "active",
    "disabled",
]);

export function tenantHasCapability(client, capability) {
    if (!client || client.status !== "active") return false;
    const enabled = (product, service) =>
        client.productAccess?.includes(product) && client.modules?.[product]?.includes(service);
    return (
        {
            "travel.flights": enabled("trehub", "flights"),
            "travel.hotels": enabled("trehub", "hotels"),
            "travel.tours": enabled("trevista", "tours"),
            payments: Boolean(client.productAccess?.length),
            "storage.documents": Boolean(client.productAccess?.length),
            "notifications.email": Boolean(client.productAccess?.length),
        }[capability] === true
    );
}
