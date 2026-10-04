const field = (name, label, type = "text", options = {}) => ({
    name, path: name, label, type, required: false, ...options,
});
const linkFields = [
    field("label", "Link text", "text", { required: true, maxLength: 100 }),
    field("href", "Link URL", "text", {
        required: true, maxLength: 2048,
        pattern: "^(?:/(?![/\\\\])[^\\s\\\\]*|https?://[^\\s\\\\]+|mailto:[^\\s]+@[^\\s]+|tel:[+0-9() -]+)$",
        patternMessage: "Use a site path, HTTP(S) URL, email link, or telephone link.",
    }),
];
export const contentSteps = [
    {
        id: "statistics", title: "Homepage statistics",
        fields: [
            field("statisticsVisible", "Show homepage statistics", "checkbox"),
            field("customerCount", "Customer count", "number", { min: 0, max: 1000000000, pattern: "^\\d+$" }),
            field("customerLabel", "Customer count label", "text", { maxLength: 100 }),
            field("statisticsItems", "Additional statistics", "entityList", {
                itemFields: [
                    field("label", "Statistic label", "text", { required: true, maxLength: 100 }),
                    field("value", "Display value", "text", { required: true, maxLength: 50 }),
                ],
            }),
        ],
    },
    {
        id: "footer", title: "Client footer",
        fields: [
            field("footerDescription", "About your travel business", "textarea", { maxLength: 1000, colSpan: 2 }),
            field("footerServicesTitle", "Services heading", "text", { maxLength: 100 }),
            field("footerLinksTitle", "Useful links heading", "text", { maxLength: 100 }),
            field("footerLinks", "Useful links", "entityList", { itemFields: linkFields }),
            field("footerSocialLinks", "Social links", "entityList", {
                itemFields: [...linkFields, field("icon", "Social platform", "select", {
                    required: true,
                    options: ["instagram", "facebook", "linkedin", "youtube", "twitter"].map((value) => ({ value, label: value })),
                })],
            }),
            field("footerLegalLinks", "Policy links", "entityList", { itemFields: linkFields }),
        ],
    },
];

export const contentValues = (home = {}) => ({
    statisticsVisible: home.statistics?.visible !== false,
    customerCount: home.statistics?.customerCount ?? "",
    customerLabel: home.statistics?.customerLabel || "Happy customers",
    statisticsItems: home.statistics?.items || [],
    footerDescription: home.footer?.description || "",
    footerServicesTitle: home.footer?.servicesTitle || "Explore our services",
    footerLinksTitle: home.footer?.linksTitle || "Useful links",
    footerLinks: home.footer?.links || [],
    footerSocialLinks: home.footer?.socialLinks || [],
    footerLegalLinks: home.footer?.legalLinks || [],
});

const items = (values = [], prefix, links = false) => values.map((item, index) => ({
    id: item.id || `${prefix}-${index + 1}`,
    label: item.label,
    ...(links ? { href: item.href, ...(item.icon ? { icon: item.icon } : {}) } : { value: item.value }),
}));

export const contentHomePage = (home = {}, values) => ({
    ...home,
    statistics: {
        ...home.statistics,
        visible: values.statisticsVisible !== false,
        customerCount: values.customerCount === "" || values.customerCount == null ? null : Number(values.customerCount),
        customerLabel: values.customerLabel || "Happy customers",
        items: items(values.statisticsItems, "stat"),
    },
    footer: {
        ...home.footer,
        description: values.footerDescription || "",
        servicesTitle: values.footerServicesTitle || "Explore our services",
        linksTitle: values.footerLinksTitle || "Useful links",
        links: items(values.footerLinks, "link", true),
        socialLinks: items(values.footerSocialLinks, "social", true),
        legalLinks: items(values.footerLegalLinks, "policy", true),
    },
});
