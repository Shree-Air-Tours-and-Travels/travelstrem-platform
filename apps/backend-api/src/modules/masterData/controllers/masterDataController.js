import masterDataService from "../services/masterDataService.js";
import {
    listPricingConfigs as listPricingConfigRecords,
    savePricingConfig,
} from "../../../core/financial-engine/services/pricing-config.service.js";
import pageDefinitionService from "../../../services/pageDefinitionService.js";

export const getMasterOptionSet = async (req, res) => {
    const key = req.params.key;
    const options = await masterDataService.getOptionSet(key);

    return res.status(200).json({
        status: "success",
        component: {
            data: { key },
            dataScope: { options: { [key]: options } },
            elements: { labels: {}, urls: {} },
            structure: { header: {}, widgets: [], config: {}, actions: [] },
        },
        message: "Master options fetched successfully",
    });
};

export const listMasterOptionSets = async (req, res) => {
    try {
        const optionSets = await masterDataService.listOptionSets();
        return res.status(200).json({ status: "success", data: { optionSets } });
    } catch (error) {
        return res
            .status(500)
            .json({ status: "error", message: "Master option sets could not be loaded" });
    }
};

export const upsertMasterOptionSet = async (req, res) => {
    if (!/^[a-zA-Z0-9._-]{3,120}$/.test(req.params.key || "")) {
        return res.status(400).json({ status: "error", message: "Invalid master option key" });
    }
    if (!Array.isArray(req.body?.options) || req.body.options.length > 500) {
        return res.status(400).json({ status: "error", message: "options must be an array" });
    }
    try {
        const optionSet = await masterDataService.upsertOptionSet(req.params.key, req.body);
        return res
            .status(200)
            .json({ status: "success", data: { optionSet }, message: "Master options saved" });
    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message || "Master options could not be saved",
        });
    }
};

export const listPricingConfigs = async (req, res) => {
    try {
        const pricingConfigs = await listPricingConfigRecords();
        const client = req.tenant?.client;
        const name = client?.globalBrand?.label || client?.name;
        const response = pageDefinitionService.buildPageResponse("admin-shell/pricing", {
            injectData: { pricingConfigs },
            ...(client ? { injectLabels: {
                heroTitle: `${name} pricing controls`,
                heroDescription: "Manage your company's fees, tax and payment-gateway recovery. New rules affect future quotes only.",
                masterAdminOnly: "Client master admin only",
                scopeGlobal: "Company default",
                platformFeeTitle: `${name} service fee`,
                platformFeeDescription: "Managed by your company's master administrator.",
                collectPlatformFee: "Collect service fee",
                collectPlatformFeeDescription: `Add the configured ${name} fee to new customer quotes.`,
                platformFeeGst: "GST on service fee (%)",
                tremFeeSummary: `${name} fee`,
            } } : {}),
        });
        if (client) response.component.structure = {
            ...response.component.structure,
            config: { ...response.component.structure.config, access: { clientRoles: ["client_master_admin"] } },
        };
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message || "Pricing configuration could not be loaded",
        });
    }
};

export const upsertPricingConfig = async (req, res) => {
    try {
        const pricingConfig = await savePricingConfig(req.body, req.access?.user?._id || req.user?._id || req.user?.id);
        return res.status(200).json({
            status: "success",
            data: { pricingConfig },
            message:
                "A new pricing version was published. Existing quotes remain unchanged.",
        });
    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: (req.tenant?.client ? error.message?.replaceAll("TravelsTREM fee", "Service fee") : error.message) || "Pricing configuration could not be saved",
        });
    }
};
