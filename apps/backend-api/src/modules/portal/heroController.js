import Hero from "./models/Hero.js";

// Default Hero
const DefaultHero = {
  title: "Travelling opens the door to creating",
  description:
    "Discover the world with TravelsTREM. Curated adventures, stunning destinations, and memories that last a lifetime.",
  data: [], // dynamic will go here if needed
  structure: {
    eyebrow: "Premium Travel Experiences",
    highlight: "memories",
    buttonText: "Explore Now",
    secondaryButtonText: "Watch story",
    featuredDestination: {
      label: "Top Destination",
      title: "Bali, Indonesia",
    },
    stats: [
      { value: "15K+", label: "Happy Travelers" },
      { value: "120+", label: "Destinations" },
      { value: "4.9", label: "Average Rating" },
    ],
    visual: {
      headline: "Live route studio",
      subline: "Flights, stays, weather, and local moments balanced in one plan.",
      orbitItems: [
        { label: "Flights", icon: "plane" },
        { label: "Stays", icon: "hotel" },
        { label: "Routes", icon: "route" },
        { label: "Weather", icon: "cloud" },
      ],
      gallery: [
        { label: "Next window", value: "Sep - Nov", icon: "calendar" },
        { label: "Trip style", value: "Slow luxury", icon: "sparkles" },
        { label: "Mood", value: "Island calm", icon: "compass" },
      ],
    },
  },
};

const toStructure = (hero = {}) => ({
  eyebrow: hero.eyebrow || DefaultHero.structure.eyebrow,
  highlight: hero.highlight || DefaultHero.structure.highlight,
  buttonText: hero.buttonText || DefaultHero.structure.buttonText,
  secondaryButtonText: hero.secondaryButtonText || DefaultHero.structure.secondaryButtonText,
  featuredDestination: hero.featuredDestination || DefaultHero.structure.featuredDestination,
  stats: Array.isArray(hero.stats) && hero.stats.length ? hero.stats : DefaultHero.structure.stats,
  visual: {
    ...DefaultHero.structure.visual,
    ...(hero.visual || {}),
    orbitItems:
      Array.isArray(hero.visual?.orbitItems) && hero.visual.orbitItems.length
        ? hero.visual.orbitItems
        : DefaultHero.structure.visual.orbitItems,
    gallery:
      Array.isArray(hero.visual?.gallery) && hero.visual.gallery.length
        ? hero.visual.gallery
        : DefaultHero.structure.visual.gallery,
  },
});

export const getHero = async (req, res) => {
  try {
    const hero = await Hero.findOne().sort({createdAt: -1});

    if (!hero) {
        return res.status(200).json({
          status: "success",
          message: "Default hero content used",
          componentData: DefaultHero,
        });
      }

      res.status(200).json({
        status: "success",
        message: "Hero content fetched successfully",
        componentData: {
          title: hero.title || DefaultHero.title,
          description: hero.description || DefaultHero.description,
          data: [], // no DB array in hero
          structure: toStructure(hero),
          config: {}, // reserved for extras
        },
      });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch hero content",
      componentData: {
        title: "Hero Section",
        description: "",
        data: [],
        structure: {},
        config: {},
      },
      error: err.message,
    });
  }
};

export const createHero = async (req, res) => {
  try {
    const newHero = new Hero(req.body);
    const savedHero = await newHero.save();

    res.status(201).json({
      status: "success",
      message: "Hero content created successfully",
      componentData: {
        title: savedHero.title,
        description: savedHero.description,
        data: [],
        structure: toStructure(savedHero),
        config: {},
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: "Failed to create hero content",
      componentData: {
        title: "Hero Section",
        description: "",
        data: [],
        structure: {},
        config: {},
      },
      error: err.message,
    });
  }
};
