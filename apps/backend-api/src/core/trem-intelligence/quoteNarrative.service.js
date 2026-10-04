const compact = (values) => values.filter(Boolean).join(" · ");

const textValue = (value) => {
    if (value == null || value === "") return "";
    if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(", ");
    if (typeof value === "object")
        return Object.entries(value)
            .map(([key, item]) => `${key}: ${textValue(item)}`)
            .filter((item) => !item.endsWith(": "))
            .join("; ");
    return String(value).trim();
};

const displayDate = (value) => {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return String(value || "");
    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${value}T00:00:00.000Z`));
};

const travelDates = (fields = {}) => {
    const fixed = String(fields.preferredTravelDate || "").split("|").filter(Boolean);
    const dates = fixed.length > 1
        ? fixed
        : [fields.preferredStartDate, fields.preferredEndDate].filter(Boolean);
    return dates.length > 1
        ? `${displayDate(dates[0])} to ${displayDate(dates[1])}`
        : displayDate(dates[0] || fields.preferredTravelDate || fields.travelWindow || "");
};

const meaningfulMessage = (value) => {
    const text = textValue(value);
    return /^(please\s+)?(give|send|share|provide)(\s+me)?\s+(the\s+|a\s+)?(quote|quotation)(\s+for\s+this\s+tour)?[.!]?$/i.test(text)
        ? ""
        : text;
};

/** Backend-owned editable customer narrative defaults for a quotation. */
export function generateQuoteNarrative({ enquiry, tour }) {
    const fields = enquiry.fields || {};
    const packageName = enquiry.selection?.packageName || enquiry.selection?.packageKey || "";
    const baseTitle = tour?.title || enquiry.tourTitle || fields.destination || "Custom journey";
    const title = packageName && !baseTitle.toLowerCase().includes(packageName.toLowerCase())
        ? `${baseTitle} — ${packageName}`
        : baseTitle;
    const customization = enquiry.customizationSnapshot || {};
    const selectedHotels = (customization.hotels || [])
        .filter((hotel) => hotel.included === false)
        .map((hotel) => `Hotel upgrade in ${hotel.location || hotel.stayKey}: ${compact([hotel.includedOptionName, hotel.includedRoomName]) || "included stay"} to ${compact([hotel.optionName, hotel.roomName]) || "requested stay"}`);
    const requestedHotels = (customization.hotelRequests || []).map((request) =>
        `Hotel request in ${request.location || request.stayKey}: ${compact([request.propertyClass, request.roomType, request.requirements]) || "agent recommendation"}`,
    );
    const flightRequest = customization.flightRequest === "ADD"
        ? "Flights requested in addition to the selected package"
        : customization.packageBaseline?.includesFlights === true
          ? "Flights are included in the selected package"
          : customization.flightRequest === "NONE"
            ? "Flights are not included or requested"
            : fields.flightPreference === "with_flights"
              ? "Flights must be included in the quotation"
              : fields.flightPreference === "agent_recommendation"
                ? "A flight recommendation is requested"
                : "";
    const summaryParts = [
        `Selected package: ${packageName || baseTitle}`,
        fields.travellerCount ? `Travellers: ${fields.travellerCount}` : "",
        travelDates(fields) ? `Travel dates: ${travelDates(fields)}` : "",
        flightRequest,
        ...selectedHotels,
        ...requestedHotels,
        textValue(enquiry.customizationAnswers),
        meaningfulMessage(fields.message || fields.notes),
    ].filter(Boolean);
    return {
        title: String(title).slice(0, 120),
        summary: (summaryParts.join(". ") || "A tailored journey prepared around the traveller's requirements.").slice(0, 1200),
        metadata: { engine: "TREM_QUOTE_INTELLIGENCE_V2", generatedAt: new Date().toISOString() },
    };
}

export default Object.freeze({ generateQuoteNarrative });
