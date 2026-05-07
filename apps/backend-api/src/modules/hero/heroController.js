import Hero from "../../models/Hero.js";

// Default Hero
const DefaultHero = {
  title: "Travelling opens the door to creating",
  description:
    "Discover the world with TravelsTREM. Curated adventures, stunning destinations, and memories that last a lifetime.",
  data: [], // dynamic will go here if needed
  structure: {
    highlight: "memories",
    buttonText: "Explore Now",
    images: {
      main: "/hero-images/air-hostest1.png",
      gallery: [
        "/hero-images/air-hostest2.jpg",
        "/hero-images/air-hostest3.jpg",
      ],
      video: "/hero-images/hero-video.mp4",
    },
  },
};

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
          structure: {
            highlight: hero.highlight,
            buttonText: hero.buttonText,
            images: hero.images,
          },
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
        structure: {
          highlight: savedHero.highlight,
          buttonText: savedHero.buttonText,
          images: savedHero.images,
        },
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
