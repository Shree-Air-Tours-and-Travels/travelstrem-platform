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
        fields.preferredTravelDate ||
        [fields.preferredStartDate, fields.preferredEndDate].filter(Boolean).join(" – ") ||
        "Flexible";
    const flightPreference =
        fields.flightPreference === "with_flights" ? "With flights" : "Without flights";
    return {
        id: String(lead?._id || ""),
        recordType: "enquiry",
        enquiryRef: lead?.enquiryRef || "",
        perspective,
        directionLabel: isSent ? "Enquiry sent" : "Enquiry received",
        status: lead?.status || "new",
        statusLabel: String(lead?.status || "new").replaceAll("_", " "),
        title: lead?.tourTitle || "General tour enquiry",
        product: lead?.product || "trevista",
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
            hotelRequests: lead?.selection?.hotelRequests || [],
            customizationPreference: lead?.selection?.customizationPreference || "package",
            quoteMode: lead?.customizationSnapshot?.quoteMode || "PACKAGE",
            pricing: lead?.customizationSnapshot || null,
            customizationAnswers: lead?.customizationAnswers || {},
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
