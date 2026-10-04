export const tenantDeployment = (client) => {
    const products = [...new Set(client.productAccess || [])];
    const product =
        products.length === 1 && ["trevio", "trevista", "trehub"].includes(products[0])
            ? products[0]
            : null;
    return {
        mode: product ? "standalone" : "app-shell",
        product,
        website: client.domains?.website || client.website || "",
    };
};

// One public contract for every tenant and portal. Secrets and database locations stay server-side.
export const tenantConfiguration = (client) => ({
    tenantId: String(client._id),
    name: client.globalBrand?.label || client.name,
    logoSrc: client.globalBrand?.logoSrc || "",
    logoDarkSrc: client.globalBrand?.logoDarkSrc || "",
    faviconSrc: client.globalBrand?.faviconSrc || "",
    windowTitle: client.globalBrand?.windowTitle || client.globalBrand?.label || client.name,
    heroImages: {
        appShell: client.homePage?.hero?.image || client.heroImages?.appShell || "",
    },
    products: client.productAccess || [],
    deployment: tenantDeployment(client),
    modules: client.modules || {},
    accountModules: [...new Set(["dashboard", ...(client.accountModules || [])])],
    portals: ["admin", "dashboard"],
    partnerEnabled: Boolean(client.partnerEnabled),
    version: client.configVersion || 1,
    theme: {
        mode: client.theme?.mode || "light",
        allowSwitching: client.theme?.allowSwitching !== false,
        light: {
            ...(client.theme?.light || {}),
            ...(client.theme?.primaryColor ? { "--color-primary": client.theme.primaryColor } : {}),
        },
        dark: {
            ...(client.theme?.dark || {}),
            ...(client.theme?.darkPrimaryColor
                ? { "--color-primary": client.theme.darkPrimaryColor }
                : {}),
        },
    },
});
export const isClientMaster = (user) => user?.clientRole === "client_master_admin";
export const isClientAdmin = (user) =>
    ["client_master_admin", "client_admin"].includes(user?.clientRole);

export const tenantFooter = (client) => ({
    variant: "client",
    brand: client.globalBrand?.label || client.name,
    productName: client.globalBrand?.label || client.name,
    logoSrc: client.globalBrand?.logoSrc || "",
    logoDarkSrc: client.globalBrand?.logoDarkSrc || "",
    owner: "",
    description: client.homePage?.footer?.description || "",
    contacts: [
        ...(client.contactEmail
            ? [
                  {
                      id: "email",
                      label: client.contactEmail,
                      href: `mailto:${client.contactEmail}`,
                      icon: "messageCircle",
                  },
              ]
            : []),
        ...(client.contactPhone
            ? [
                  {
                      id: "phone",
                      label: client.contactPhone,
                      href: `tel:${client.contactPhone.replace(/[^+\d]/g, "")}`,
                      icon: "phoneCall",
                  },
              ]
            : []),
        ...(client.business?.address
            ? [
                  {
                      id: "address",
                      label: client.business.address,
                      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.business.address)}`,
                      target: "_blank",
                      icon: "mapPin",
                  },
              ]
            : []),
    ],
    sections: [
        {
            id: "travel",
            title: client.homePage?.footer?.servicesTitle || "Explore our services",
            links: [
                ...(client.productAccess?.includes("trevio")
                    ? [{ id: "trips", label: "Trips & adventures", href: "/trevio/trips" }]
                    : []),
                ...(client.productAccess?.includes("trevista")
                    ? [{ id: "tours", label: "Tours & packages", href: "/trevista/tours" }]
                    : []),
                ...(client.productAccess?.includes("trehub") &&
                client.modules?.trehub?.includes("flights")
                    ? [{ id: "flights", label: "Flights", href: "/trehub/flights" }]
                    : []),
                ...(client.productAccess?.includes("trehub") &&
                client.modules?.trehub?.includes("hotels")
                    ? [{ id: "hotels", label: "Hotels", href: "/trehub/hotels" }]
                    : []),
            ],
        },
        {
            id: "links",
            title: client.homePage?.footer?.linksTitle || "Useful links",
            links: client.homePage?.footer?.links || [],
        },
    ].filter((section) => section.links.length),
    socialLinks: client.homePage?.footer?.socialLinks || [],
    legalLinks: client.homePage?.footer?.legalLinks || [],
});

// Deployment snapshot only. The platform retains billing, provisioning, secrets and its client registry.
export const tenantRuntimeConfiguration = (client) => {
    const source = client.toObject ? client.toObject() : client;
    const fields = ["_id", "name", "slug", "status", "productAccess", "locale", "currency", "contactEmail", "contactPhone", "website", "domains", "modules", "productConfig", "accountModules", "roles", "partnerEnabled", "theme", "configVersion", "branding", "globalBrand", "heroImages", "homePage", "createdAt", "updatedAt"];
    return {
        ...Object.fromEntries(fields.filter((key) => source[key] !== undefined).map((key) => [key, source[key]])),
        database: { name: source.database?.name },
        business: { address: source.business?.address || "" },
    };
};
