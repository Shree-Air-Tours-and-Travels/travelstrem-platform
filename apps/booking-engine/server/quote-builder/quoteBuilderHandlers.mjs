const errorResponse = (res, error) => {
  if (!error?.status)
    console.error("[QuoteBuilder] request failed:", error?.stack || error);
  return res.status(error?.status || 500).json({
    status: "error",
    message: error?.status ? error.message : "The quote builder request could not be completed.",
  });
};

export function createQuoteBuilderHandlers(service) {
  return {
    load: async (req, res) => {
      try {
        const componentData = await service.load(req.params.enquiryId, req.user);
        return res.json({ status: "success", componentData });
      } catch (error) {
        return errorResponse(res, error);
      }
    },
    transition: async (req, res) => {
      try {
        const result = await service.transition(req.params.enquiryId, req.user, req.body);
        return res.status(result.status).json({
          status: result.status < 400 ? "success" : "error",
          message: result.status < 400 ? "Quote draft saved." : "Check the highlighted fields.",
          componentData: result.componentData,
        });
      } catch (error) {
        return errorResponse(res, error);
      }
    },
    preview: async (req, res) => {
      try {
        const result = await service.preview(req.params.enquiryId, req.user, req.body);
        return res.status(result.status).json({
          status: result.status < 400 ? "success" : "error",
          message: result.status < 400 ? "Quotation calculated." : "Check the highlighted fields.",
          componentData: result.componentData,
        });
      } catch (error) {
        return errorResponse(res, error);
      }
    },
    send: async (req, res) => {
      try {
        const result = await service.send(req.params.enquiryId, req.user, req.body);
        return res.status(result.status).json({
          status: result.status < 400 ? "success" : "error",
          message: result.status < 400 ? "Quote generated and sent." : "Check the highlighted fields.",
          componentData: result.componentData,
          data: { quoteId: result.quoteId || null, documentId: result.documentId || null },
        });
      } catch (error) {
        return errorResponse(res, error);
      }
    },
  };
}

export default createQuoteBuilderHandlers;
