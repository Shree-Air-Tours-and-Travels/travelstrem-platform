import Product from "../tenancy/models/Product.js";
import { contentSteps } from "./registration.content.js";
const field = (name, label, type = "text", options = {}) => ({
    name,
    path: name,
    label,
    type,
    required: true,
    ...(["text", "email", "tel", "url"].includes(type) ? { maxLength: 500 } : {}),
    ...options,
});
const email = { pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", maxLength: 254 };
const url = { pattern: "^https?://[^\\s]+$", maxLength: 2048 };
export async function registrationWorkflow(data = {}, editing = false) {
    const products = await Product.find({ status: "active", hidden: { $ne: true } }).lean();
    const selected = products.filter((p) => (data.productAccess || []).includes(p.key));
    const steps = [
        {
            id: "business",
            title: "Company & contact",
            fields: [
                field("name", "Company name"),
                field("slug", "Tenant identifier", "text", {
                    pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                    maxLength: 64,
                }),
                field("legalName", "Legal business name"),
                field("registrationNumber", "Business registration number"),
                field("taxNumber", "Tax / GST number", "text", { required: false }),
                field("address", "Business address"),
                field("contactEmail", "Contact email", "email", email),
                field("contactPhone", "Contact phone", "tel"),
            ],
        },
        {
            id: "products",
            title: "Products & modules",
            fields: [
                field("productAccess", "Enabled products", "multiselect", {
                    minItems: 1,
                    options: products.map((p) => ({ value: p.key, label: p.name })),
                }),
                field("accountModules", "Account modules", "multiselect", {
                    options: ["bookings", "wishlist", "profile", "notifications", "support"].map(
                        (value) => ({ value, label: value }),
                    ),
                }),
            ],
        },
        ...selected.map((p) => ({
            id: `product-${p.key}`,
            title: `${p.name} configuration`,
            fields: [
                field(`modules_${p.key}`, "Enabled services", "multiselect", {
                    required: (p.services || []).length > 0,
                    options: (p.services || []).map((value) => ({ value, label: value })),
                }),
                ...(p.metadata?.registrationFields || []).map((f) => ({
                    ...f,
                    name: `${p.key}_${f.name}`,
                    path: `${p.key}_${f.name}`,
                })),
            ],
        })),
        ...((data.productAccess || []).some((key) => ["trevio", "trevista"].includes(key))
            ? [
                  {
                      id: "partners",
                      title: "Partner agencies",
                      fields: [
                          field("partnerEnabled", "Enable partner agency workflows", "select", {
                              options: [
                                  { value: "yes", label: "Yes, manage partner agencies" },
                                  { value: "no", label: "No, internal operations only" },
                              ],
                          }),
                      ],
                  },
              ]
            : []),
        {
            id: "branding",
            title: "White-label branding",
            fields: [
                field("logoSrc", "Light theme logo URL", "url", url),
                field("logoDarkSrc", "Dark theme logo URL", "url", { ...url, required: false }),
                field("faviconSrc", "Favicon URL", "url", url),
                field("windowTitle", "Browser window title"),
                field("brandName", "Display name"),
                field("themeMode", "Default theme", "select", { required: false, options: [{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }] }),
                field("themeSwitching", "Allow theme switching", "select", { required: false, options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] }),
                field("primaryColor", "Primary colour", "text", { pattern: "^#[0-9a-fA-F]{6}$" }),
                field("darkPrimaryColor", "Dark theme primary colour", "text", {
                    pattern: "^#[0-9a-fA-F]{6}$",
                }),
            ],
        },
        ...contentSteps,
        {
            id: "hosting",
            title: "Domains & database",
            fields: [
                field("website", "Website origin", "url", url),
                field("authUrl", "Authentication origin", "url", url),
                field("adminUrl", "Admin TREM origin", "url", url),
                field("dashboardUrl", "Dashboard origin", "url", url),
                field("apiUrl", "API origin", "url", url),
                ...(data.partnerEnabled === "yes" &&
                (data.productAccess || []).some((key) => ["trevio", "trevista"].includes(key))
                    ? [field("partnerUrl", "Partner portal origin", "url", url)]
                    : []),
                field("databaseSecretRef", "Database secret reference", "select", {
                    options: Object.keys(process.env)
                        .filter((key) => /^TENANT_DB_[A-Z0-9_]+$/.test(key))
                        .map((value) => ({ value, label: value })),
                }),
                field("databaseName", "Database name", "text", {
                    pattern: "^[a-zA-Z0-9_-]{1,64}$",
                }),
            ],
        },
        {
            id: "billing",
            title: "Billing configuration",
            fields: [
                field("billingEmail", "Billing email", "email", email),
                field("billingPlan", "Plan reference"),
                field("billingCycle", "Billing cycle", "select", {
                    options: ["monthly", "annual", "custom"].map((value) => ({
                        value,
                        label: value,
                    })),
                }),
                field("currency", "Currency", "text", { pattern: "^[A-Z]{3}$" }),
                field("locale", "Locale"),
            ],
        },
        ...(!editing ? [{
            id: "administrator",
            title: "Client master administrator",
            fields: [
                field("adminName", "Administrator name"),
                field("adminEmail", "Activation email", "email", email),
            ],
        }] : []),
        {
            id: "review",
            title: editing ? "Review & save" : "Review & provision",
            fields: [
                field(
                    "confirmed",
                    editing
                        ? "Confirm client configuration changes"
                        : "Confirm tenant configuration and send the administrator activation email",
                    "checkbox",
                ),
            ],
        },
    ];
    return {
        key: "client-registration",
        version: 1,
        title: editing ? "Client configuration" : "Client registration",
        steps: steps.map((step) => ({
            ...step,
            requiredFields: step.fields
                .filter((f) => f.required)
                .map((f) => ({ path: f.path, label: f.label })),
        })),
    };
}
