import Service from "../models/Service.js";
import pageDefinitionService from "../../../services/pageDefinitionService.js";

export const getServices = async (req, res) => {
    try {
        const services = await Service.find().sort({ createdAt: -1 });

        res.status(200).json({
            ...pageDefinitionService.buildWidgetResponse("customer-shell/home", "./widgets/services.json", {
                injectData: { services },
            }),
            message: "Services fetched successfully",
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            message: "Failed to fetch services",
            error: err.message,
        });
    }
};

export const createService = async (req, res) => {
    try {
        const newService = new Service(req.body);

        const savedService = await newService.save();

        res.status(201).json({
            ...pageDefinitionService.buildWidgetResponse("customer-shell/home", "./widgets/services.json", {
                injectData: { services: [savedService] },
            }),
            message: "Service created successfully",
        });
    } catch (err) {
        res.status(400).json({
            status: "error",
            message: "Failed to create service",
            error: err.message,
        });
    }
};
