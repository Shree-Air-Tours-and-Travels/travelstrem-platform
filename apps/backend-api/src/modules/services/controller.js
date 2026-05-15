import Service from "./models/Service.js";

// Default Services
const DefaultServices = [
    {
        id: "flights-hotels",
        label: "Flights & Hotels",
        shortDescription:
            "Premium flight deals and carefully selected hotel stays worldwide.",
        description:
            "Book the best deals on domestic and international flights and comfortable hotel stays worldwide.",
        fullDescription:
            "Discover seamless flight and accommodation booking experiences tailored to your travel style. From luxury resorts and boutique stays to business hotels and international flights, we ensure comfort, convenience, and exclusive pricing throughout your journey.",
        image: "/service-images/flights-hotel.png",
        coverImage: "/service-images/flights-cover.jpg",
        features: [
            "Domestic & International Flights",
            "Luxury & Budget Hotels",
            "24x7 Booking Support",
            "Custom Stay Recommendations",
        ],
        highlights: [
            "Best pricing",
            "Fast confirmations",
            "Premium stays",
        ],
        cta: {
            label: "Explore bookings",
            href: "/services/flights-hotels",
        },
    },

    {
        id: "travel-packages",
        label: "Travel Packages",
        shortDescription:
            "Handcrafted travel packages for unforgettable experiences.",
        description:
            "Explore our curated domestic and international travel packages for every kind of traveler.",
        fullDescription:
            "Whether you seek relaxing beach escapes, mountain adventures, romantic getaways, or international explorations, our curated travel packages are designed to deliver memorable and stress-free experiences with thoughtfully planned itineraries.",
        image: "/service-images/guide.png",
        coverImage: "/service-images/travel-packages-cover.jpg",
        features: [
            "Domestic & International Tours",
            "Customized Itineraries",
            "Group & Solo Trips",
            "Luxury Travel Experiences",
        ],
        highlights: [
            "Curated journeys",
            "Flexible plans",
            "Luxury experiences",
        ],
        cta: {
            label: "View packages",
            href: "/services/travel-packages",
        },
    },

    {
        id: "visa-passport",
        label: "Visa & Passport Assistance",
        shortDescription:
            "Smooth and reliable documentation assistance for your travels.",
        description:
            "Get expert assistance for your visa applications and passport-related services.",
        fullDescription:
            "Simplify your travel documentation process with professional visa and passport assistance. Our team guides you through every step, ensuring faster processing, proper documentation, and hassle-free application support.",
        image: "/service-images/visa.png",
        coverImage: "/service-images/visa-cover.jpg",
        features: [
            "Tourist & Business Visas",
            "Documentation Guidance",
            "Passport Assistance",
            "Application Tracking Support",
        ],
        highlights: [
            "Expert support",
            "Faster processing",
            "Reliable guidance",
        ],
        cta: {
            label: "Get assistance",
            href: "/services/visa-passport",
        },
    },

    {
        id: "corporate-packages",
        label: "Corporate Packages",
        shortDescription:
            "Efficient travel management solutions for modern businesses.",
        description:
            "Tailored corporate travel solutions including flights, hotels, and event arrangements for your business needs.",
        fullDescription:
            "Enhance your corporate travel experience with tailored business travel solutions. From executive hotel bookings and event coordination to seamless transport and itinerary management, we help businesses travel smarter and more efficiently.",
        image: "/service-images/corporate.png",
        coverImage: "/service-images/corporate-cover.jpg",
        features: [
            "Business Travel Planning",
            "Corporate Event Support",
            "Executive Hotel Bookings",
            "Dedicated Account Assistance",
        ],
        highlights: [
            "Business focused",
            "Efficient planning",
            "Premium support",
        ],
        cta: {
            label: "Explore corporate plans",
            href: "/services/corporate-packages",
        },
    },

    {
        id: "cab-services",
        label: "Cab Services",
        shortDescription:
            "Comfortable and reliable transportation for every journey.",
        description:
            "Convenient and affordable cab services for airport transfers, sightseeing, and outstation travel.",
        fullDescription:
            "Travel comfortably with our trusted cab services designed for airport pickups, local sightseeing, and outstation trips. Enjoy safe rides, professional drivers, and convenient travel experiences wherever you go.",
        image: "/service-images/cab.png",
        coverImage: "/service-images/cab-cover.jpg",
        features: [
            "Airport Transfers",
            "Outstation Travel",
            "Local Sightseeing",
            "Professional Drivers",
        ],
        highlights: [
            "Safe rides",
            "Affordable pricing",
            "Comfort travel",
        ],
        cta: {
            label: "Book a cab",
            href: "/services/cab-services",
        },
    },
];

const servicesMeta = {
    title: "Our Services",
    description:
        "Curated travel experiences and premium travel solutions designed to make every journey seamless, elegant, and memorable.",
};

export const getServices = async (req, res) => {
    try {
        const services = await Service.find().sort({ createdAt: -1 });

        if (!services.length) {
            return res.status(200).json({
                status: "success",
                message: "Default services used",
                componentData: {
                    ...servicesMeta,
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
                ...servicesMeta,
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
                ...servicesMeta,
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
                ...servicesMeta,
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
                ...servicesMeta,
                data: [],
                structure: {},
                config: {},
            },
            error: err.message,
        });
    }
};
