import jwt from "jsonwebtoken";
import pageDefinitionService from "../../services/pageDefinitionService.js";
import config from "../../config/index.js";

const parseOverride = (raw) => {
  if (!raw) return undefined;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return undefined;
  }
};

function extractOptionalUser(req) {
  if (req.user) return { userId: req.user.sub || req.user.id };

  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  try {
    const secret = (config.JWT && config.JWT.accessSecret) || process.env.JWT_SECRET;
    const payload = jwt.verify(authHeader.split(" ")[1], secret);
    return { userId: payload.sub || payload.id };
  } catch {
    return null;
  }
}

export const getPageDefinition = async (req, res) => {
  const pageKey = req.params.pageKey || `${req.params.app}/${req.params.page}`;
  const authUser = extractOptionalUser(req);
  return pageDefinitionService.resolvePage(req, res, pageKey, {
    remoteOverrides: parseOverride(req.query.remoteOverrides),
    featureOverrides: parseOverride(req.query.featureOverrides),
    authUser,
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
    dataScope: { options: {} },
    elements: { labels: {}, urls: {} },
    structure: { header: {}, widgets: [], config: {}, actions: [] },
  },
});
