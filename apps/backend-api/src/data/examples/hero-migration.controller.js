/**
 * Hero Controller - Page Definition Pattern
 * 
 * BEFORE:
 *   controller manually constructed payload with hardcoded defaults
 *   → res.json({ status, message, componentData: { title, description, data, structure, config } })
 * 
 * AFTER:
 *   controller loads definition from data/ and injects dynamic content
 *   → pageDefinitionService.resolvePage() with injectData
 * 
 * Migration path: HeroController → pageDefinitionService + dynamic hero data
 */

import pageDefinitionService from "../../services/pageDefinitionService.js";
import Hero from "../models/Hero.js";

/**
 * @example
 * GET /api/hero.json
 * 
 * Response shape:
 * {
 *   "status": "success",
 *   "component": {
 *     "data": {
 *       "title": "Travelling opens the door to creating",
 *       "subtitle": "memories",
 *       "description": "Discover the world with TravelsTREM...",
 *       "itemIds": []
 *     },
 *     "elements": {
 *       "labels": {
 *         "heroEyebrow": "Premium Travel Experiences",
 *         "heroButtonText": "Explore Now",
 *         ...
 *       },
 *       "urls": { ... }
 *     },
 *     "structure": {
 *       "widgets": [
 *         { "type": "Hero", "props": { "titleRef": "heroEyebrow", ... } }
 *       ]
 *     }
 *   }
 * }
 */

export const getHero = async (req, res) => {
  try {
    const hero = await Hero.findOne().sort({ createdAt: -1 });

    const injectData = hero
      ? {
          title: hero.title,
          subtitle: hero.highlight || "",
          description: hero.description,
        }
      : {};

    const injectLabels = hero
      ? {
          heroEyebrow: hero.eyebrow,
          heroButtonText: hero.buttonText,
          heroSecondaryButtonText: hero.secondaryButtonText,
        }
      : {};

    return pageDefinitionService.resolvePage(req, res, "customer-shell/home", {
      injectData,
      injectLabels,
      statusCode: 200,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch hero content",
      component: {
        data: { title: "", subtitle: "", description: "", itemIds: [] },
        elements: { labels: {}, urls: {} },
        structure: {},
      },
      error: err.message,
    });
  }
};

export const createHero = async (req, res) => {
  try {
    const newHero = new Hero(req.body);
    const savedHero = await newHero.save();

    const injectData = {
      title: savedHero.title,
      subtitle: savedHero.highlight || "",
      description: savedHero.description,
    };

    return pageDefinitionService.resolvePage(req, res, "customer-shell/home", {
      injectData,
      statusCode: 201,
    });
  } catch (err) {
    return res.status(400).json({
      status: "error",
      message: "Failed to create hero content",
      component: {
        data: { title: "", subtitle: "", description: "", itemIds: [] },
        elements: { labels: {}, urls: {} },
        structure: {},
      },
      error: err.message,
    });
  }
};
