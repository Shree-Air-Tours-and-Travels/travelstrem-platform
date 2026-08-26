const PHONE_COUNTRY_CODES = `
+93|AF +355|AL +213|DZ +376|AD +244|AO +54|AR +374|AM +61|AU +43|AT +994|AZ
+973|BH +880|BD +375|BY +32|BE +501|BZ +229|BJ +975|BT +591|BO +387|BA +267|BW
+55|BR +673|BN +359|BG +226|BF +257|BI +855|KH +237|CM +1|CA +238|CV +236|CF
+235|TD +56|CL +86|CN +57|CO +269|KM +242|CG +506|CR +385|HR +53|CU +357|CY
+420|CZ +45|DK +253|DJ +593|EC +20|EG +503|SV +240|GQ +372|EE +251|ET +679|FJ
+358|FI +33|FR +241|GA +220|GM +995|GE +49|DE +233|GH +30|GR +502|GT +224|GN
+245|GW +592|GY +509|HT +504|HN +852|HK +36|HU +354|IS +91|IN +62|ID +98|IR
+964|IQ +353|IE +972|IL +39|IT +225|CI +81|JP +962|JO +7|KZ +254|KE +965|KW
+996|KG +856|LA +371|LV +961|LB +266|LS +231|LR +218|LY +423|LI +370|LT +352|LU
+853|MO +389|MK +261|MG +265|MW +60|MY +960|MV +223|ML +356|MT +222|MR +230|MU
+52|MX +691|FM +373|MD +377|MC +976|MN +382|ME +212|MA +258|MZ +95|MM +264|NA
+977|NP +31|NL +64|NZ +505|NI +227|NE +234|NG +850|KP +47|NO +968|OM +92|PK
+680|PW +970|PS +507|PA +675|PG +595|PY +51|PE +63|PH +48|PL +351|PT +974|QA
+40|RO +7|RU +250|RW +685|WS +378|SM +966|SA +221|SN +381|RS +248|SC +232|SL
+65|SG +421|SK +386|SI +677|SB +252|SO +27|ZA +82|KR +211|SS +34|ES +94|LK
+249|SD +597|SR +268|SZ +46|SE +41|CH +963|SY +886|TW +992|TJ +255|TZ +66|TH
+670|TL +228|TG +676|TO +216|TN +90|TR +993|TM +688|TV +256|UG +380|UA +971|AE
+44|GB +1|US +598|UY +998|UZ +678|VU +379|VA +58|VE +84|VN +967|YE +260|ZM +263|ZW
`
    .trim()
    .split(/\s+/)
    .map((entry, index) => {
        const [dialCode, countryCode] = entry.split("|");
        return {
            value: `${countryCode}:${dialCode}`,
            label: `${dialCode} ${countryCode}`,
            sortOrder: index,
            metadata: { dialCode, countryCode },
        };
    });

export const DEFAULT_OPTION_SETS = Object.freeze({
    "common.phoneCountryCodes": {
        description: "International telephone country codes available in contact forms",
        options: PHONE_COUNTRY_CODES,
    },
    "trevista.tourBuilderSteps": {
        product: "trevista",
        description: "Ordered top-level steps for the agent/admin tour builder",
        options: [
            {
                value: "basic",
                label: "Basics",
                sortOrder: 0,
                metadata: { shortLabel: "Basics", helper: "Identity and location" },
            },
            {
                value: "schedule",
                label: "Schedule",
                sortOrder: 10,
                metadata: { shortLabel: "Schedule", helper: "Dates and availability" },
            },
            {
                value: "itinerary",
                label: "Itinerary",
                sortOrder: 20,
                metadata: { shortLabel: "Itinerary", helper: "One screen per day" },
            },
            {
                value: "pricing",
                label: "Packages",
                sortOrder: 30,
                metadata: { shortLabel: "Packages", helper: "Components and package composition" },
            },
            {
                value: "logistics",
                label: "Operations",
                sortOrder: 40,
                metadata: { shortLabel: "Operations", helper: "Booking, policies and inventory" },
            },
            {
                value: "content",
                label: "Publish",
                sortOrder: 50,
                metadata: { shortLabel: "Publish", helper: "Description and visibility" },
            },
            {
                value: "review",
                label: "Review",
                sortOrder: 60,
                metadata: { shortLabel: "Review", helper: "Check and submit" },
            },
        ],
    },
    "trevista.tourBuilderRequiredFields": {
        product: "trevista",
        description: "Backend-owned required-field contract used by every tour CRUD client",
        options: [
            { value: "title", label: "Tour title", sortOrder: 0, metadata: { step: "basic" } },
            {
                value: "city.from",
                label: "Departure city",
                sortOrder: 10,
                metadata: { step: "basic" },
            },
            {
                value: "city.to",
                label: "Destination city",
                sortOrder: 20,
                metadata: { step: "basic" },
            },
            { value: "distance", label: "Distance", sortOrder: 30, metadata: { step: "basic" } },
            { value: "period.days", label: "Days", sortOrder: 40, metadata: { step: "schedule" } },
            {
                value: "period.nights",
                label: "Nights",
                sortOrder: 50,
                metadata: { step: "schedule" },
            },
            {
                value: "departures",
                label: "Departure details",
                sortOrder: 60,
                metadata: { step: "schedule", conditional: "when-present" },
            },
            {
                value: "itinerary",
                label: "Itinerary day details",
                sortOrder: 70,
                metadata: { step: "itinerary", conditional: "when-present" },
            },
            {
                value: "commercial",
                label: "Package pricing",
                sortOrder: 80,
                metadata: { step: "pricing" },
            },
            {
                value: "maxGroupSize",
                label: "Maximum group size",
                sortOrder: 90,
                metadata: { step: "logistics" },
            },
            { value: "desc", label: "Description", sortOrder: 100, metadata: { step: "content" } },
        ],
    },
    "trevista.packageTypeOptions": {
        product: "trevista",
        options: [
            { value: "fixed_departure", label: "Fixed departure", sortOrder: 0 },
            { value: "flexible", label: "Flexible dates", sortOrder: 10 },
            { value: "custom", label: "Custom / quote-based", sortOrder: 20 },
        ],
    },
    "trevista.departureStatusOptions": {
        product: "trevista",
        options: ["scheduled", "active", "sold_out", "cancelled"].map((value, index) => ({
            value,
            label: value.replaceAll("_", " "),
            sortOrder: index * 10,
        })),
    },
    "trevista.tourStatusOptions": {
        product: "trevista",
        options: ["draft", "pending_approval", "published", "unpublished", "cancelled"].map(
            (value, index) => ({ value, label: value.replaceAll("_", " "), sortOrder: index * 10 }),
        ),
    },
    "trevista.extraCategoryOptions": {
        product: "trevista",
        options: ["activity", "transfer", "meal", "visa", "insurance", "other"].map(
            (value, index) => ({ value, label: value, sortOrder: index * 10 }),
        ),
    },
    "trevista.commercialComponentTypeOptions": {
        product: "trevista",
        options: [
            "ACCOMMODATION",
            "FLIGHT",
            "ACTIVITY",
            "TRANSFER",
            "MEAL",
            "SIGHTSEEING",
            "VISA",
            "INSURANCE",
            "GUIDE",
            "TAX",
            "AGENT_CHARGE",
            "MISCELLANEOUS",
        ].map((value, index) => ({
            value,
            label: value.replaceAll("_", " "),
            sortOrder: index * 10,
        })),
    },
    "trevista.commercialPricingUnitOptions": {
        product: "trevista",
        options: [
            "PER_PERSON",
            "PER_ADULT",
            "PER_CHILD",
            "PER_INFANT",
            "PER_ROOM",
            "PER_NIGHT",
            "PER_ROOM_PER_NIGHT",
            "PER_PERSON_PER_NIGHT",
            "PER_VEHICLE",
            "PER_TRIP",
            "PER_DAY",
            "PER_GROUP",
            "PER_BOOKING",
            "FIXED",
        ].map((value, index) => ({
            value,
            label: value.replaceAll("_", " "),
            sortOrder: index * 10,
        })),
    },
    "trevista.commercialStatusOptions": {
        product: "trevista",
        options: ["CONFIRMED", "ESTIMATED", "REPRICE_REQUIRED"].map((value, index) => ({
            value,
            label: value.replaceAll("_", " "),
            sortOrder: index * 10,
        })),
    },
    "trevista.packageTierOptions": {
        product: "trevista",
        options: [
            { value: "BASIC", label: "Base", sortOrder: 0 },
            { value: "STANDARD", label: "Standard", sortOrder: 10 },
            { value: "PREMIUM", label: "Premium", sortOrder: 20 },
        ],
    },
    "trevista.flexiblePricingModelOptions": {
        product: "trevista",
        options: [
            { value: "seasonal", label: "Seasonal", sortOrder: 0 },
            { value: "fixed", label: "Fixed", sortOrder: 10 },
            { value: "on_request", label: "On request", sortOrder: 20 },
        ],
    },
    "trevista.stayTierOptions": {
        product: "trevista",
        options: ["base", "standard", "premium"].map((value, index) => ({
            value,
            label: value[0].toUpperCase() + value.slice(1),
            sortOrder: index * 10,
        })),
    },
    "common.currencyOptions": {
        description: "Currencies enabled for prices entered by operations users",
        options: [{ value: "INR", label: "INR - Indian Rupee", sortOrder: 0 }],
    },
    "trevista.customTourJourneyTypeOptions": {
        product: "trevista",
        description: "Date flexibility choices for custom-tour enquiries",
        options: [
            { value: "fixed", label: "Fixed dates", sortOrder: 0 },
            { value: "flexible", label: "Flexible dates", sortOrder: 10 },
            { value: "custom", label: "Fully custom / dates undecided", sortOrder: 20 },
        ],
    },
    "trevista.customTourFlightOptions": {
        product: "trevista",
        description: "Flight handling choices for custom-tour enquiries",
        options: [
            { value: "with_flights", label: "Include flights", sortOrder: 0 },
            { value: "without_flights", label: "I will arrange flights", sortOrder: 10 },
            {
                value: "agent_recommendation",
                label: "Let the specialist recommend",
                sortOrder: 20,
            },
        ],
    },
    "trevista.customTourAccommodationOptions": {
        product: "trevista",
        description: "Accommodation preferences for custom-tour enquiries",
        options: [
            { value: "hotel", label: "Hotels", sortOrder: 0 },
            { value: "resort", label: "Resorts", sortOrder: 10 },
            { value: "villa", label: "Private villas", sortOrder: 20 },
            { value: "homestay", label: "Homestays", sortOrder: 30 },
            { value: "camp", label: "Camps / glamping", sortOrder: 40 },
        ],
    },
    "trevista.customTourTransportOptions": {
        product: "trevista",
        description: "Transport preferences for custom-tour enquiries",
        options: [
            { value: "private_car", label: "Private car", sortOrder: 0 },
            { value: "self_drive", label: "Self drive", sortOrder: 10 },
            { value: "train", label: "Train", sortOrder: 20 },
            { value: "coach", label: "Coach", sortOrder: 30 },
            { value: "local_transit", label: "Local transport", sortOrder: 40 },
        ],
    },
    "trevista.customTourInterestOptions": {
        product: "trevista",
        description: "Experience preferences for custom-tour enquiries",
        options: [
            { value: "culture", label: "Culture & heritage", sortOrder: 0 },
            { value: "food", label: "Food & local experiences", sortOrder: 10 },
            { value: "nature", label: "Nature & wildlife", sortOrder: 20 },
            { value: "adventure", label: "Adventure", sortOrder: 30 },
            { value: "wellness", label: "Wellness", sortOrder: 40 },
            { value: "beaches", label: "Beaches", sortOrder: 50 },
            { value: "nightlife", label: "Nightlife", sortOrder: 60 },
            { value: "family", label: "Family activities", sortOrder: 70 },
            { value: "shopping", label: "Shopping", sortOrder: 80 },
        ],
    },
    "trevista.customTourPaceOptions": {
        product: "trevista",
        description: "Trip pace preferences for custom-tour enquiries",
        options: [
            { value: "relaxed", label: "Relaxed", sortOrder: 0 },
            { value: "balanced", label: "Balanced", sortOrder: 10 },
            { value: "packed", label: "See as much as possible", sortOrder: 20 },
        ],
    },
    "trevista.customTourCurrencyOptions": {
        product: "trevista",
        description: "Currencies accepted for custom-tour enquiry budgets",
        options: ["INR", "USD", "GBP", "EUR", "AED"].map((value, index) => ({
            value,
            label: value,
            sortOrder: index * 10,
        })),
    },
    "trevista.priceSourceOptions": {
        product: "trevista",
        description: "Accepted provenance values for Tour price snapshots",
        options: ["manual", "ai", "agent", "calculated", "component_calculation"].map(
            (value, index) => ({ value, label: value.replaceAll("_", " "), sortOrder: index * 10 }),
        ),
    },
    "trevista.tourOperationsSectionOptions": {
        product: "trevista",
        options: [
            "booking",
            "cancellation",
            "extras",
            "stays",
            "hotels",
            "media",
            "highlights",
        ].map((value, index) => ({
            value,
            label: value === "hotels" ? "Upgrades" : value[0].toUpperCase() + value.slice(1),
            sortOrder: index * 10,
        })),
    },
    "trevista.commercialBasisFieldOptions": {
        product: "trevista",
        options: [
            { value: "adults", label: "Adults", metadata: { minimum: 1 } },
            { value: "children", label: "Children", metadata: { minimum: 0 } },
            { value: "infants", label: "Infants", metadata: { minimum: 0 } },
            { value: "rooms", label: "Rooms", metadata: { minimum: 1 } },
            { value: "vehicles", label: "Vehicles", metadata: { minimum: 1 } },
            { value: "nights", label: "Nights", metadata: { minimum: 0 } },
            { value: "days", label: "Days", metadata: { minimum: 1 } },
        ].map((option, index) => ({ ...option, sortOrder: index * 10 })),
    },
    "trevista.commercialComponentStepOptions": {
        product: "trevista",
        options: ["details", "pricing", "upgrade"].map((value, index) => ({
            value,
            label: value[0].toUpperCase() + value.slice(1),
            sortOrder: index * 10,
        })),
    },
    "trevista.commercialPackageStepOptions": {
        product: "trevista",
        options: [
            { value: "details", label: "Package details", sortOrder: 0 },
            { value: "assignment", label: "Included components", sortOrder: 10 },
        ],
    },
    "trevio.quickChipOptions": {
        product: "trevio",
        description: "Trevio discovery shortcuts",
        options: [
            { value: "all", label: "All", sortOrder: 0 },
            { value: "weekend", label: "Weekend", sortOrder: 10 },
            { value: "mountains", label: "Mountains", sortOrder: 20 },
            { value: "roadtrips", label: "Road trips", sortOrder: 30 },
        ],
    },
    "trevista.tourFeaturedOptions": {
        product: "trevista",
        description: "Public tour featured-state filter",
        options: [
            { value: "all", label: "Any status", sortOrder: 0 },
            { value: "true", label: "Featured only", sortOrder: 10 },
            { value: "false", label: "Standard tours", sortOrder: 20 },
        ],
    },
    "trevista.discoveryChipOptions": {
        product: "trevista",
        description: "Curated high-level tour discovery shortcuts",
        options: [
            { value: "all", label: "All tours", sortOrder: 0, metadata: { type: "ALL" } },
            {
                value: "domestic",
                label: "Domestic",
                sortOrder: 10,
                metadata: { type: "TAG", filterValue: "domestic" },
            },
            {
                value: "international",
                label: "International",
                sortOrder: 20,
                metadata: { type: "TAG", filterValue: "international" },
            },
            {
                value: "featured",
                label: "Featured",
                sortOrder: 30,
                metadata: { type: "FEATURED", filterValue: true },
            },
            {
                value: "adventure",
                label: "Adventure",
                sortOrder: 40,
                metadata: { type: "TAG", filterValue: "adventure" },
            },
            {
                value: "family",
                label: "Family",
                sortOrder: 50,
                metadata: { type: "TAG", filterValue: "family" },
            },
            {
                value: "luxury",
                label: "Luxury",
                sortOrder: 60,
                metadata: { type: "TAG", filterValue: "luxury" },
            },
        ],
    },
    "trevista.tourSortOptions": {
        product: "trevista",
        description: "Public tour sorting choices",
        options: [
            { value: "recommended", label: "Recommended", sortOrder: 0 },
            { value: "price_asc", label: "Price: Low to High", sortOrder: 10 },
            { value: "price_desc", label: "Price: High to Low", sortOrder: 20 },
            { value: "duration", label: "Duration", sortOrder: 30 },
            { value: "newest", label: "Newest", sortOrder: 40 },
            { value: "popular", label: "Popular", sortOrder: 50 },
            { value: "trending", label: "Trending", sortOrder: 60 },
            { value: "rating", label: "Rating", sortOrder: 70 },
        ],
    },
    "trevista.travelMonthOptions": {
        product: "trevista",
        description: "Bookable month shortcuts maintained by operations",
        options: ["August 2026", "September 2026", "October 2026"].map((value, index) => ({
            value,
            label: value,
            sortOrder: index * 10,
        })),
    },
    "trevista.travellerCountOptions": {
        product: "trevista",
        options: [10, 20, 30].map((value, index) => ({
            value: String(value),
            label: `${value} travellers`,
            sortOrder: index * 10,
        })),
    },
    "trevista.tripStyleOptions": {
        product: "trevista",
        options: [
            "Adventure",
            "Beach",
            "Culture",
            "Family",
            "Heritage",
            "Luxury",
            "Romance",
            "Wellness",
            "Trekking",
        ].map((label, index) => ({ value: label.toLowerCase(), label, sortOrder: index * 10 })),
    },
    "trevista.budgetOptions": {
        product: "trevista",
        options: ["₹50k – ₹1L", "₹1L – ₹2L", "₹2L+"].map((value, index) => ({
            value,
            label: value,
            sortOrder: index * 10,
        })),
    },
    "trevista.defaultRoomOptions": {
        product: "trevista",
        description: "Fallback room upgrades used when a tour has no agent-provided hotel options",
        options: [
            {
                value: "Standard Room",
                label: "Standard Room",
                sortOrder: 0,
                metadata: { desc: "Comfortable 4-star room with breakfast", price: 0 },
            },
            {
                value: "Deluxe Room",
                label: "Deluxe Room",
                sortOrder: 10,
                metadata: { desc: "Larger room with upgraded view and amenities", price: 8000 },
            },
            {
                value: "Premium Suite",
                label: "Premium Suite",
                sortOrder: 20,
                metadata: { desc: "Premium hotel category and suite accommodation", price: 22000 },
            },
        ],
    },
    "trevista.transportOptions": {
        product: "trevista",
        description: "Local-transfer choices and pricing",
        options: [
            {
                value: "Shared transfers",
                label: "Shared transfers",
                sortOrder: 0,
                metadata: { desc: "Air-conditioned shared vehicle with fixed schedule", price: 0 },
            },
            {
                value: "Private sedan",
                label: "Private sedan",
                sortOrder: 10,
                metadata: { desc: "Private car for airport and itinerary transfers", price: 12000 },
            },
            {
                value: "Private SUV",
                label: "Private SUV",
                sortOrder: 20,
                metadata: { desc: "Private SUV for extra comfort and luggage", price: 19000 },
            },
        ],
    },
    "common.titleOptions": {
        description: "Traveller honorifics",
        options: ["Mr", "Mrs", "Ms", "Miss", "Dr"].map((value, index) => ({
            value,
            label: value,
            sortOrder: index * 10,
        })),
    },
    "common.countryOptions": {
        description: "Countries enabled for booking forms",
        options: [
            { value: "IN", label: "India", sortOrder: 0 },
            { value: "US", label: "United States", sortOrder: 10 },
            { value: "GB", label: "United Kingdom", sortOrder: 20 },
        ],
    },
    "common.genderOptions": {
        options: [
            { value: "male", label: "Male", sortOrder: 0 },
            { value: "female", label: "Female", sortOrder: 10 },
            { value: "non_binary", label: "Non-binary", sortOrder: 20 },
            { value: "prefer_not_to_say", label: "Prefer not to say", sortOrder: 30 },
        ],
    },
    "common.tripTypeOptions": {
        options: [
            { value: "all", label: "All types", sortOrder: 0 },
            { value: "domestic", label: "Domestic", sortOrder: 10 },
            { value: "international", label: "International", sortOrder: 20 },
        ],
    },
    "tours.preferredContactOptions": {
        description: "Customer contact channel choices",
        options: [
            { value: "whatsapp", label: "WhatsApp", sortOrder: 0 },
            { value: "phone", label: "Phone call", sortOrder: 10 },
            { value: "email", label: "Email", sortOrder: 20 },
        ],
    },
    "appShell.favoriteProductOptions": {
        product: "app-shell",
        description: "Product filters for saved travel items",
        options: [
            { value: "all", label: "All products", sortOrder: 0 },
            { value: "trevio", label: "Trevio", sortOrder: 10 },
            { value: "trevista", label: "Trevista", sortOrder: 20 },
        ],
    },
});

export default DEFAULT_OPTION_SETS;
