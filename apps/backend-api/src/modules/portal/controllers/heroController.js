import Hero from "../models/Hero.js";
import pageDefinitionService from "../../../services/pageDefinitionService.js";

export const getHero = async (req, res) => {
  try {
    const hero = await Hero.findOne().sort({createdAt: -1});
    const page = pageDefinitionService.buildWidgetResponse("customer-shell/home", "./widgets/hero.json", {
      injectData: hero ? { hero } : {},
    });

    return res.status(200).json({
      ...page,
      message: "Hero content fetched successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch hero content",
      error: err.message,
    });
  }
};

export const createHero = async (req, res) => {
  try {
    const allowed = ["title", "highlight", "description", "eyebrow", "buttonText", "secondaryButtonText", "featuredDestination", "stats", "visual", "images"];
    const body = {};
    for (const key of allowed) {
        if (req.body[key] !== undefined) body[key] = req.body[key];
    }
    const newHero = new Hero(body);
    const savedHero = await newHero.save();

    res.status(201).json({
      ...pageDefinitionService.buildWidgetResponse("customer-shell/home", "./widgets/hero.json", {
        injectData: { hero: savedHero },
      }),
      message: "Hero content created successfully",
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: "Failed to create hero content",
      error: err.message,
    });
  }
};
