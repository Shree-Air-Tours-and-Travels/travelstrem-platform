export const getBuilderDefinition = async (req, res) => {
    try {
        const { getBuilderOverview } = await import("./tourBuilder.service.js");
        const result = await getBuilderOverview(req);
        return res.json(result);
    } catch (error) {
        return res.status(error.status || 400).json({ status: "error", message: error.message, ...(error.details ? { errors: error.details } : {}) });
    }
};

export const getBuilderStep = async (req, res) => {
    try {
        const { loadBuilderStep } = await import("./tourBuilder.service.js");
        const result = await loadBuilderStep(req, {
            tourId: req.query.tourId || req.params.tourId || null,
            stepKey: req.params.stepKey,
        });
        return res.json({ status: "success", builder: result.builder, ...result });
    } catch (error) {
        return res.status(error.status || 400).json({ status: "error", message: error.message, ...(error.details ? { errors: error.details } : {}) });
    }
};

export const getBuilderTemplate = async (req, res) => {
    try {
        const { getBuilderTemplatePayload } = await import("./builderTemplate.service.js");
        const result = getBuilderTemplatePayload({ stepKey: req.query.stepKey || null });
        return res.json({ status: "success", ...result });
    } catch (error) {
        return res.status(error.status || 400).json({ status: "error", message: error.message, ...(error.details ? { errors: error.details } : {}) });
    }
};

export const updateBuilderPosition = async (req, res) => {
    try {
        const { saveBuilderPosition } = await import("./tourBuilder.service.js");
        const result = await saveBuilderPosition(req, {
            tourId: req.body?.tourId || null,
            stepKey: req.body?.stepKey || null,
        });
        return res.json({ status: "success", ...result });
    } catch (error) {
        return res.status(error.status || 400).json({ status: "error", message: error.message, ...(error.details ? { errors: error.details } : {}) });
    }
};

export const saveBuilderStep = async (req, res) => {
    try {
        const { saveBuilderStep: saveStep } = await import("./tourBuilder.service.js");
        const body = req.body || {};
        const result = await saveStep(req, {
            tourId: body.tourId || null,
            stepKey: req.params.stepKey,
            data: body.data,
        });
        return res.json({
            status: "success",
            message: result.saved ? "Step saved" : "Nothing to save",
            success: true,
            saved: result.saved,
            tourId: result.tourId,
            previousStepKey: result.previousStepKey,
            nextStepKey: result.nextStepKey,
            ...(result.data ? { data: result.data } : {}),
        });
    } catch (error) {
        return res.status(error.status || 400).json({ status: "error", message: error.message, ...(error.details ? { errors: error.details } : {}) });
    }
};

export const previewBuilderPricing = async (req, res) => {
    try {
        const { previewBuilderPricing: previewPricing } = await import("./tourBuilder.service.js");
        const result = await previewPricing(req, {
            tourId: req.body?.tourId || null,
            data: req.body?.data || {},
        });
        return res.json({ status: "success", ...result });
    } catch (error) {
        return res.status(error.status || 400).json({
            status: "error",
            message: error.message,
            ...(error.details ? { errors: error.details } : {}),
        });
    }
};
