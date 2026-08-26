// Presentation mapping for ContactLead documents, shared by the forms
// controllers (getLeads / getEnquiry) and the dashboard data service.

export const formatDate = (value) => {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    }).format(date);
};

const formatTravelDate = (value) => {
    const parts = String(value || "")
        .split(/[|,]/)
        .map((part) => part.trim())
        .filter(Boolean);
    if (!parts.length) return "";
    const formatted = parts.map((part) => formatDate(part) || part);
    return formatted.length > 1 ? formatted.join(" – ") : formatted[0];
};

const guidanceByStatus = {
    new: "Your enquiry has been received. A travel specialist will review the request and contact you with the next steps.",
    sent: "Your enquiry has been sent successfully. You will be notified when a travel specialist responds.",
    in_review:
        "A travel specialist is reviewing your dates and preferences. You will be notified when the response is ready.",
    quote_requested:
        "Your request is being prepared for quotation. Final availability and pricing will be shared in the response.",
    quote_sent:
        "Your quotation is ready. Review the confirmed options before continuing with the booking.",
    responded:
        "A travel specialist has responded to your enquiry. Review the latest update and available options.",
    closed: "This enquiry has been completed. Its submitted details remain available for your records.",
};

const receivedGuidanceByStatus = {
    new: "This enquiry is ready for review. Check the traveller's dates and preferences before responding.",
    sent: "The enquiry was received and is waiting for a travel specialist to review it.",
    in_review:
        "This enquiry is under review. Confirm availability and prepare the appropriate response.",
    quote_requested: "The traveller is waiting for a quotation based on the submitted request.",
    quote_sent: "A quotation has been sent to the traveller and is awaiting their decision.",
    responded: "A response has been shared with the traveller. Further updates will appear here.",
    closed: "This enquiry is complete and remains available as a record of the request.",
};

const formatMoney = (minor, currency = "INR") => {
    if (minor == null) return "";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(Number(minor) / 100);
};

export const enquiryCenterView = (perspective = "sent") => {
    const isSent = perspective === "sent";
    return {
        title: isSent ? "My bookings & enquiries" : "Bookings & enquiries received",
        description: isSent
            ? "Track every request you have sent and any booking confirmed for your account."
            : "Review traveller requests and the bookings confirmed from them.",
        labels: {
            listEyebrow: "Tour support",
            totalSuffix: "total",
            booking: "Booking",
            enquiry: "Enquiry",
            back: "Back to bookings & enquiries",
            contact: isSent ? "Your contact details" : "Traveller details",
            requested: isSent ? "Your submitted request" : "Traveller request",
            name: "Name",
            email: "Email",
            phone: "Phone",
            preferredContact: "Preferred contact",
            bookingAmount: "Booking amount",
            travellers: "Travellers",
            departure: "Travel dates",
            flightPreference: "Flight preference",
            package: "Selected package",
            hotelRoom: "Hotel and room preferences",
            message: "Your message",
        },
        claim: {
            title: "Add an existing enquiry",
            description:
                "If you submitted an enquiry before signing in, enter the reference from your confirmation email to add it here.",
            fieldLabel: "Enquiry reference",
            placeholder: "ENQ-ABC123",
            submit: "Add enquiry",
            submitting: "Adding enquiry…",
        },
        table: {
            title: "All records",
            description: "Search your enquiries and confirmed bookings.",
            searchPlaceholder: "Search by reference, tour or contact",
            recordType: "Record type",
            allRecords: "All records",
            bookings: "Bookings",
            enquiries: "Enquiries",
            sortBy: "Sort by",
            newest: "Newest",
            reference: "Reference",
            tourService: "Tour or service",
            type: "Type",
            customerSpecialist: isSent ? "Travel specialist" : "Customer",
            travellers: "Travellers",
            travelDate: "Travel dates",
            status: "Status",
            created: "Created",
            viewDetails: "View details",
        },
        states: {
            loadErrorTitle: "Bookings and enquiries could not be loaded",
            emptyTitle: "No bookings or enquiries yet",
            emptyDescription: "Your submitted enquiries and confirmed bookings will appear here.",
        },
    };
};

export const enquiryView = (lead, perspective) => {
    const fields = lead?.fields || {};
    const isSent = perspective === "sent";
    const counterpart = isSent
        ? {
              label: "Sent to",
              name: lead?.agentSnapshot?.name || "TravelsTREM support team",
              email: lead?.agentSnapshot?.email || "",
              phone: lead?.agentSnapshot?.phone || "",
          }
        : {
              label: "Received from",
              name: fields.name || "Traveller",
              email: fields.email || "",
              phone: fields.phone || "",
          };
    const departure =
        formatTravelDate(fields.preferredTravelDate) ||
        [fields.preferredStartDate, fields.preferredEndDate]
            .filter(Boolean)
            .map((value) => formatDate(value) || value)
            .join(" – ") ||
        "Flexible";
    const flightPreference =
        fields.flightPreference === "with_flights"
            ? "With flights"
            : fields.flightPreference === "without_flights"
              ? "Without flights"
              : fields.flightPreference === "agent_recommendation"
                ? "Travel specialist recommendation"
                : "";
    const customTourDetails =
        lead?.form === "custom-tour"
            ? {
                  "Journey type":
                      fields.journeyType === "fixed"
                          ? "Fixed dates"
                          : fields.journeyType === "flexible"
                            ? "Flexible dates"
                            : "Fully custom",
                  "Starting from": fields.origin || "",
                  Destinations: Array.isArray(fields.destinations)
                      ? fields.destinations.join(", ")
                      : fields.destinations || "",
                  "Preferred duration": fields.durationDays
                      ? `${fields.durationDays} days`
                      : fields.travelWindow || "",
                  Travellers: [
                      fields.adults ? `${fields.adults} adults` : "",
                      fields.children ? `${fields.children} children` : "",
                      fields.infants ? `${fields.infants} infants` : "",
                  ]
                      .filter(Boolean)
                      .join(", "),
                  Accommodation: (fields.accommodationPreferences || []).join?.(", ") || "",
                  Transport: (fields.transportPreferences || []).join?.(", ") || "",
                  Interests: (fields.interests || []).join?.(", ") || "",
                  Pace: fields.pace || "",
                  Budget:
                      [fields.budgetMin, fields.budgetMax].filter(Boolean).join(" – ") +
                      ([fields.budgetMin, fields.budgetMax].some(Boolean)
                          ? ` ${fields.currency || "INR"}`
                          : ""),
              }
            : {};
    return {
        id: String(lead?._id || ""),
        recordType: "enquiry",
        recordTypeLabel: "Enquiry",
        enquiryRef: lead?.enquiryRef || "",
        perspective,
        directionLabel: isSent ? "Enquiry sent" : "Enquiry received",
        status: lead?.status || "new",
        statusLabel: String(lead?.status || "new").replaceAll("_", " "),
        guidance:
            (isSent ? guidanceByStatus : receivedGuidanceByStatus)[
                String(lead?.status || "new").toLowerCase()
            ] ||
            (isSent
                ? "Your enquiry details are saved here. Updates will appear as the request progresses."
                : "The submitted enquiry details and future updates are available here."),
        title: lead?.tourTitle || "General tour enquiry",
        product: lead?.product || "trevista",
        assignmentRule: lead?.assignmentRule || "",
        tourId: lead?.tourId || null,
        counterpart,
        request: {
            message: fields.message || "",
            travellers: fields.travellerCount || "",
            departure,
            flightPreference,
            preferredContact: fields.preferredContact || "",
            package: lead?.selection?.packageName || "",
            hotelRoom: lead?.selection?.hotelSelections?.length
                ? lead.selection.hotelSelections
                      .map(
                          (item) =>
                              `${item.location || item.stayKey}: ${item.hotelName}${item.roomName ? ` — ${item.roomName}` : ""}`,
                      )
                      .join("; ")
                : lead?.selection?.hotelRoomName || "",
            hotelSelections: lead?.selection?.hotelSelections || [],
            hotelRequests: (lead?.selection?.hotelRequests || []).map((request) => ({
                stayKey: request.stayKey,
                label: `Hotel request · ${request.location || request.stayKey}`,
                value: [
                    request.propertyClass,
                    request.roomType,
                    request.budgetPerNightMinor == null
                        ? ""
                        : `${formatMoney(request.budgetPerNightMinor, request.currency)} per room / night`,
                    request.requirements,
                ]
                    .filter(Boolean)
                    .join(" · "),
            })),
            customizationPreference: lead?.selection?.customizationPreference || "package",
            quoteMode: lead?.customizationSnapshot?.quoteMode || "PACKAGE",
            customizationAnswers: {
                ...customTourDetails,
                ...(lead?.customizationAnswers || {}),
            },
        },
        submittedBy: isSent
            ? { name: fields.name || "You", email: fields.email || "", phone: fields.phone || "" }
            : counterpart,
        recipient: isSent
            ? counterpart
            : {
                  name: lead?.agentSnapshot?.name || "Assigned travel specialist",
                  email: lead?.agentSnapshot?.email || "",
                  phone: lead?.agentSnapshot?.phone || "",
              },
        createdAt: lead?.createdAt,
        createdLabel: formatDate(lead?.createdAt),
        notified: Boolean(lead?.notified),
    };
};
