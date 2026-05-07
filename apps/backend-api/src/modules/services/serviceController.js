import Service from "../../models/Service.js";

// Default Services
const DefaultServices = [
    {
        id: "cab-services",
        label: "Cab Services",
        description:
            "Convenient and affordable cab services for airport transfers, sightseeing, and outstation travel.",
        image: "/service-images/cab.png",
    },
    {
        id: "flights-hotels",
        label: "Flights & Hotels",
        description:
            "Book the best deals on Domestic and International flights and comfortable hotel stays worldwide.",
        image: "/service-images/flights-hotel.png",
    },

    {
        id: "travel-packages",
        label: "Travel Packages",
        description:
            "Explore our curated Domestic and International travel packages for every kind of traveler.",
        image: "/service-images/guide.png",
    },
    {
        id: "visa-passport",
        label: "Visa & Passport Assistance",
        description:
            "Get expert assistance for your visa applications and passport-related services.",
        image: "/service-images/visa.png",
    },
    {
        id: "corporate-packages",
        label: "Corporate Packages",
        description:
            "Tailored corporate travel solutions including flights, hotels, and event arrangements for your business needs.",
        image: "/service-images/corporate.png",
    }
];

export const getServices = async (req, res) => {
    try {
        const services = await Service.find().sort({ createdAt: -1 });

         if (!services.length) {
                return res.status(200).json({
                    status: "success",
                    message: "Default services used",
                    componentData: {
                        title: "Our Services",
                        description:
                            "We offer a complete range of travel solutions to make your journey hassle-free and memorable.",
                        data: DefaultServices,
                        structure: {},
                        config: {},
                    },
                });
            }

            res.status(200).json({
                status: "success",
                message: "Services fetched successfully",
                componentData: {
                    title: "Our Services",
                    description:
                        "We offer a complete range of travel solutions to make your journey hassle-free and memorable.",
                    data: services,
                    structure: {},
                    config: {},
                },
            });
    } catch (err) {
        res.status(500).json({
            status: "error",
            message: "Failed to fetch services",
            componentData: {
                title: "Our Services",
                description: "",
                data: [],
                structure: {},
                config: {},
            },
            error: err.message,
        });
    }
};

export const createService = async (req, res) => {
    try {
        const newService = new Service(req.body);
        const savedService = await newService.save();

        res.status(201).json({
            status: "success",
            message: "Service created successfully",
            componentData: {
                title: "Our Services",
                description: "",
                data: [savedService],
                structure: {},
                config: {},
            },
        });
    } catch (err) {
        res.status(400).json({
            status: "error",
            message: "Failed to create service",
            componentData: {
                title: "Our Services",
                description: "",
                data: [],
                structure: {},
                config: {},
            },
            error: err.message,
        });
    }
};
