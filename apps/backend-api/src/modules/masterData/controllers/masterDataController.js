import masterDataService from "../services/masterDataService.js";

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
