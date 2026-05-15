/**
 * Page Definition Route - New API endpoint for serving page definitions
 * 
 * Mount this in server.js:
 *   import pageDefinitionRoutes from "./data/examples/page-definition-route.js";
 *   app.use("/api/page-definitions", pageDefinitionRoutes);
 * 
 * This provides a unified endpoint for frontends to request page definitions.
 */

import express from "express";
import pageDefinitionService from "../../services/pageDefinitionService.js";

const router = express.Router();

/**
 * GET /api/page-definitions/:pageKey
 * 
 * Returns the full page definition for the given page key.
 * Supports query parameters for dynamic content injection.
 * 
 * @param {string} pageKey - Page key or alias (e.g., "home", "customer-shell/home", "/tours")
 * @query {object} data - JSON-encoded data overrides
 * @query {object} labels - JSON-encoded label overrides
 * 
 * @example
 *   GET /api/page-definitions/home
 *   GET /api/page-definitions/tours-remote/listing?data={"title":"Custom Title"}
 *   GET /api/page-definitions/tours-remote/details?labels={"bookNow":"Réservez maintenant"}
 */
router.get("/:pageKey(*)", (req, res) => {
  try {
    const { pageKey } = req.params;
    const dataOverride = req.query.data ? JSON.parse(req.query.data) : {};
    const labelsOverride = req.query.labels ? JSON.parse(req.query.labels) : {};

    const response = pageDefinitionService.buildPageResponse(pageKey, {
      injectData: dataOverride,
      injectLabels: labelsOverride,
    });

    return res.json(response);
  } catch (err) {
    return res.status(404).json({
      status: "error",
      message: err.message,
    });
  }
});

/**
 * GET /api/page-definitions
 * 
 * Returns the page registry (all available page definitions).
 */
router.get("/", (req, res) => {
  const registry = pageDefinitionService.getRegisteredPages();
  const pathMap = pageDefinitionService.getPathMap();
  const aliases = pageDefinitionService.getAliases();

  return res.json({
    status: "success",
    pages: registry,
    pathMap,
    aliases,
  });
});

/**
 * GET /api/page-definitions/:pageKey/labels
 * 
 * Returns only labels for a page (useful for localization/white-label).
 * Frontends can pre-fetch labels separately from data.
 */
router.get("/:pageKey/labels", (req, res) => {
  try {
    const { pageKey } = req.params;
    const labels = pageDefinitionService.renderLabelsOnly(pageKey);
    return res.json(labels);
  } catch (err) {
    return res.status(404).json({
      status: "error",
      message: err.message,
    });
  }
});

/**
 * POST /api/page-definitions/resolve
 * 
 * Batch resolve page definitions for multiple pages.
 * Useful when a shell app needs definitions for multiple pages upfront.
 * 
 * Body: { pages: ["home", "profile", "tours"] }
 */
router.post("/resolve", (req, res) => {
  try {
    const { pages = [] } = req.body;
    if (!Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Request body must contain a 'pages' array",
      });
    }

    const definitions = {};
    for (const pageKey of pages) {
      try {
        definitions[pageKey] = pageDefinitionService.buildPageResponse(pageKey);
      } catch {
        definitions[pageKey] = null;
      }
    }

    return res.json({
      status: "success",
      definitions,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

export default router;
