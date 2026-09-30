import {
    getTourProcessSnapshot,
    submitTourProcessAction,
    TOUR_BUILDER_PROCESS,
} from "../../../core/process-engine/tourProcess.service.js";

export const getTourProcessDefinition = async (req, res) =>
    res.json({
        status: "success",
        component: {
            data: { definition: TOUR_BUILDER_PROCESS, process: getTourProcessSnapshot({}) },
        },
    });

export const processTourAction = async (req, res) => {
    try {
        const result = await submitTourProcessAction(req, req.body || {});
        if (!result.ok)
            return res.status(422).json({
                status: "error",
                message: "This process step is incomplete",
                component: { data: result },
            });
        return res.json({
            status: "success",
            message: "Tour draft saved",
            component: {
                data: {
                    tour: result.tour.toObject(),
                    process: getTourProcessSnapshot(result.process),
                    nextNode: result.nextNode,
                },
            },
        });
    } catch (error) {
        return res.status(error.status || 400).json({ status: "error", message: error.message });
    }
};
