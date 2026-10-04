import mongoose from "mongoose";

const { Schema } = mongoose;

const productBrandingSchema = new Schema(
    {
        logoSrc: { type: String, default: "" },
        name: { type: String, default: "" },
        subtitle: { type: String, default: "" },
        initial: { type: String, default: "" },
    },
    { _id: false },
);

const clientHeroImagesSchema = new Schema(
    {
        appShell: { type: String, default: "" },
    },
    { _id: false },
);

const homeLinkSchema = new Schema(
    {
        id: String,
        label: String,
        href: {
            type: String,
            validate: (value) => !value || /^(\/(?!\/)|https?:\/\/|mailto:|tel:)/i.test(value),
        },
        icon: String,
    },
    { _id: false },
);

const homePageSchema = new Schema(
    {
        hero: {
            image: String,
            eyebrow: String,
            title: String,
            description: String,
            searchVisible: { type: Boolean, default: true },
            trustItems: {
                type: [new Schema({ id: String, label: String, icon: String }, { _id: false })],
                default: undefined,
            },
        },
        statistics: {
            visible: { type: Boolean, default: true },
            customerCount: { type: Number, min: 0, default: null },
            customerLabel: { type: String, default: "Happy customers" },
            items: {
                type: [new Schema({ id: String, label: String, value: String }, { _id: false })],
                default: [],
            },
        },
        featured: {
            visible: { type: Boolean, default: true },
            eyebrow: String,
            title: String,
            description: String,
        },
        customise: {
            visible: { type: Boolean, default: true },
            eyebrow: String,
            title: String,
            highlight: String,
            description: String,
            image: String,
            advantages: {
                type: [
                    new Schema(
                        { id: String, icon: String, title: String, description: String },
                        { _id: false },
                    ),
                ],
                default: undefined,
            },
        },
        faq: {
            visible: { type: Boolean, default: false },
            title: { type: String, default: "Frequently asked questions" },
            description: String,
            items: {
                type: [
                    new Schema({ id: String, question: String, answer: String }, { _id: false }),
                ],
                default: [],
            },
        },
        footer: {
            description: String,
            servicesTitle: { type: String, default: "Explore our services" },
            linksTitle: { type: String, default: "Useful links" },
            links: { type: [homeLinkSchema], default: [] },
            socialLinks: { type: [homeLinkSchema], default: [] },
            legalLinks: { type: [homeLinkSchema], default: [] },
        },
    },
    { _id: false },
);

const clientSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        status: { type: String, enum: ["active", "inactive"], default: "active" },
        productAccess: [{ type: String, trim: true, lowercase: true }],
        locale: { type: String, default: "en-IN" },
        currency: { type: String, default: "INR" },
        contactEmail: { type: String, default: "" },
        contactPhone: { type: String, default: "" },
        website: { type: String, default: "" },

        business: {
            legalName: String,
            registrationNumber: String,
            taxNumber: String,
            address: String,
        },
        domains: {
            website: String,
            auth: String,
            admin: String,
            dashboard: String,
            api: String,
            partner: String,
        },
        database: { secretRef: String, name: String },
        modules: { type: Map, of: [String], default: {} },
        productConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
        accountModules: {
            type: [String],
            default: ["dashboard", "bookings", "wishlist", "profile", "notifications", "support"],
        },
        roles: { type: Map, of: [String], default: {} },
        partnerEnabled: { type: Boolean, default: false },
        billing: { email: String, plan: String, cycle: String },
        theme: {
            mode: { type: String, enum: ["light", "dark"], default: "light" },
            allowSwitching: { type: Boolean, default: true },
            primaryColor: String,
            darkPrimaryColor: String,
            light: { type: Map, of: String },
            dark: { type: Map, of: String },
        },
        configVersion: { type: Number, default: 1 },
        administrator: { name: String, email: String },
        provisioning: { status: { type: String, default: "pending" }, emailSent: Boolean },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        branding: { type: Map, of: productBrandingSchema, default: () => new Map() },
        globalBrand: {
            logoSrc: { type: String, default: "" },
            logoDarkSrc: { type: String, default: "" },
            faviconSrc: { type: String, default: "" },
            windowTitle: { type: String, default: "" },
            label: { type: String, default: "" },
        },
        heroImages: { type: clientHeroImagesSchema, default: () => ({}) },
        homePage: { type: homePageSchema, default: () => ({}) },
    },
    { timestamps: true },
);

clientSchema.index(
    { "domains.website": 1 },
    { unique: true, partialFilterExpression: { "domains.website": { $type: "string" } } },
);
clientSchema.index(
    { "database.secretRef": 1, "database.name": 1 },
    {
        unique: true,
        partialFilterExpression: {
            "database.secretRef": { $type: "string" },
            "database.name": { $type: "string" },
        },
    },
);

export const tenantConfigurationSchema = clientSchema.omit([
    "billing.email",
    "billing.plan",
    "billing.cycle",
    "administrator.name",
    "administrator.email",
    "provisioning.status",
    "provisioning.emailSent",
    "database.secretRef",
    "createdBy",
    "updatedBy",
    "business.legalName",
    "business.registrationNumber",
    "business.taxNumber",
]);
tenantConfigurationSchema.clearIndexes();

const Client = mongoose.model(
    "Client",
    process.env.TENANT_CLIENT_ID ? tenantConfigurationSchema : clientSchema,
    process.env.TENANT_CLIENT_ID ? "tenantconfigurations" : "clients",
);

export default Client;
