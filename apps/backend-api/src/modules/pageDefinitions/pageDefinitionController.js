import pageDefinitionService from "../../services/pageDefinitionService.js";

const parseOverride = (raw) => {
  if (!raw) return undefined;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return undefined;
  }
};

export const getPageDefinition = (req, res) => {
  const pageKey = req.params.pageKey || `${req.params.app}/${req.params.page}`;
  return pageDefinitionService.resolvePage(req, res, pageKey, {
    remoteOverrides: parseOverride(req.query.remoteOverrides),
    featureOverrides: parseOverride(req.query.featureOverrides),
  });
};

export const getPageRegistry = (req, res) => res.json({
  status: "success",
  component: {
    data: {
      pages: pageDefinitionService.getRegisteredPages(),
      pathMap: pageDefinitionService.getPathMap(),
      aliases: pageDefinitionService.getAliases(),
    },
    elements: { labels: {}, urls: {} },
    structure: {},
  },
});
