// Shared operational collections belong to the tenant; platform registration and licensing do not.
export function tenantModelNames(client) {
    const names = new Set([
        "Client",
        "User",
        "Product",
        "Invitation",
        "AuthIdentity",
        "RefreshToken",
        "OAuthTransaction",
        "ActivationSession",
        "UserVerification",
        "MobileOtpChallenge",
        "AuditLog",
        "TenantIntegrationProfile",
        "MasterOptionSet",
    ]);
    const enabled = (product, service) =>
        client.productAccess?.includes(product) && client.modules?.[product]?.includes(service);
    if (client.accountModules?.includes("notifications")) names.add("TenantNotification");
    if (client.accountModules?.includes("support"))
        ["SupportTicket", "SupportTicketMessage"].forEach((name) => names.add(name));
    if (client.partnerEnabled)
        [
            "AgencyMerchantConfig", "PartnerAgency",
            "AgencyCustomer",
            "PartnershipRequest",
            "AgentDeletionRequest",
            "ProductAccessRequest",
        ].forEach((name) => names.add(name));
    if (enabled("trevista", "tours"))
        [
            "Tour",
            "TourDeparture",
            "TourDiscoveryChip",
            "TourInteraction",
            "CustomTourRequest",
        ].forEach((name) => names.add(name));
    if (enabled("trevio", "trips")) names.add("TrevioTrip");
    if (enabled("trehub", "flights")) names.add("FlightBooking");
    if (enabled("trehub", "flights") || enabled("trehub", "hotels")) names.add("SavedSearch");
    if (
        (enabled("trevista", "tours") || enabled("trevio", "trips")) &&
        client.accountModules?.includes("wishlist")
    )
        names.add("Favorite");
    if (client.productAccess?.length)
        [
            "ContactLead",
            "Booking",
            "BookingQuote",
            "BookingDocument",
            "BookingPayment",
            "PaymentSettings", "PaymentConfig", "PaymentProviderConfig", "FinancialLedgerEntry", "FinancialSettlement",
            "PlatformPricingConfig",
            "TaxRule",
            "Coupon",
            "PaymentSession",
            "PaymentTransaction",
            "PaymentWebhookEvent",
            "Refund",
        ].forEach((name) => names.add(name));
    return names;
}

export async function ensureTenantIndexes(model) {
    let existing = [];
    try { existing = await model.collection.indexes(); }
    catch (error) { if (error.code !== 26) throw error; }
    const definitions = new Map();
    for (const [key, options] of model.schema.indexes()) {
        const signature = JSON.stringify(key);
        definitions.set(signature, { key, options: { ...definitions.get(signature)?.options, ...options } });
    }
    for (const [signature, { key, options }] of definitions) {
        const current = existing.find((index) => JSON.stringify(index.key) === signature);
        if (current) {
            if (options.unique && !current.unique)
                console.warn(`[Tenant indexes] Existing ${model.collection.name} index ${signature} needs the dedicated index migration; preserving it during startup.`);
            // Existing TTL changes require a separate data-retention migration.
            continue;
        }
        await model.collection.createIndex(key, options);
    }
}
