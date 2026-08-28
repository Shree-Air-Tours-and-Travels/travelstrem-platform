import PDFDocument from "pdfkit";
import config from "../config/index.js";

const COMPANY = {
    name: config.COMPANY_NAME,
    tagline: config.COMPANY_TAGLINE,
    email: config.SUPPORT_EMAIL,
    phone: config.SUPPORT_PHONE,
};

function header(doc, title) {
    doc.fontSize(20).font("Helvetica-Bold").text(COMPANY.name, { align: "center" });
    doc.fontSize(9).font("Helvetica").text(COMPANY.tagline, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(7)
        .fillColor("#666")
        .text(`${COMPANY.email}  |  ${COMPANY.phone}`, { align: "center" });
    doc.fillColor("#000");
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#ddd").stroke();
    doc.moveDown(0.8);
    doc.fontSize(16).font("Helvetica-Bold").text(title, { align: "center" });
    doc.moveDown(0.5);
}

function footer(doc) {
    const bottom = 750;
    doc.moveTo(50, bottom).lineTo(545, bottom).strokeColor("#ddd").stroke();
    doc.fontSize(7)
        .fillColor("#999")
        .text(`${COMPANY.name}  |  ${COMPANY.email}  |  ${COMPANY.phone}`, 50, bottom + 6, {
            align: "center",
            width: 495,
        });
    doc.text(
        `Generated on ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}`,
        50,
        bottom + 18,
        { align: "center", width: 495 },
    );
    doc.fillColor("#000");
}

function labelValue(doc, label, value, opts = {}) {
    const x = opts.x || 50;
    const y = opts.y || doc.y;
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#555").text(label, x, y, { continued: true });
    doc.font("Helvetica")
        .fillColor("#000")
        .text(` ${value || ","}`, { indent: 0 });
}

function sectionTitle(doc, text) {
    doc.moveDown(0.7);
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#222").text(text);
    doc.moveTo(50, doc.y + 2)
        .lineTo(545, doc.y + 2)
        .strokeColor("#eee")
        .stroke();
    doc.moveDown(0.4);
}

function formatINR(amount) {
    if (amount == null) return ",";
    return `₹ ${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d) {
    if (!d) return ",";
    return new Date(d).toLocaleDateString("en-IN", { dateStyle: "long" });
}

export function generateQuotePdf(booking, quote, tour, travelers) {
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    header(doc, "TRAVEL QUOTE");
    doc.moveDown(0.3);

    labelValue(doc, "Booking Ref:", booking.bookingRef);
    labelValue(
        doc,
        "Quote Ref / Version:",
        `${quote.quoteRef || `${booking.bookingRef}-Q${quote.version}`}  (v${quote.version || 1})`,
    );
    labelValue(doc, "Date:", formatDate(quote.createdAt));
    labelValue(doc, "Valid Until:", formatDate(quote.expirationDate) || "7 days from issue");
    doc.moveDown(0.5);

    sectionTitle(doc, "Tour Details");
    labelValue(doc, "Tour:", tour?.title || ",");
    labelValue(doc, "Destination:", `${tour?.city?.from || ","} → ${tour?.city?.to || ","}`);
    labelValue(doc, "Dates:", `${formatDate(booking.startDate)} , ${formatDate(booking.endDate)}`);
    labelValue(doc, "Guests:", String(booking.guestsCount || travelers?.length || 1));
    doc.moveDown(0.3);

    labelValue(doc, "Contact:", booking.primaryContact?.name || ",");
    labelValue(doc, "Email:", booking.primaryContact?.email || ",");
    labelValue(doc, "Phone:", booking.primaryContact?.phone || ",");

    sectionTitle(doc, "Price Breakdown");

    const items = [];
    if (quote.basePrice > 0) items.push(["Base tour/package cost", formatINR(quote.basePrice)]);
    if (quote.hotelPrice > 0) items.push(["Hotel", formatINR(quote.hotelPrice)]);
    if (quote.transferPrice > 0) items.push(["Transfers", formatINR(quote.transferPrice)]);
    if (quote.activitiesPrice > 0)
        items.push(["Activities / experiences", formatINR(quote.activitiesPrice)]);
    if (quote.mealsPrice > 0) items.push(["Meals", formatINR(quote.mealsPrice)]);
    if (quote.flightPrice > 0) items.push(["Flights", formatINR(quote.flightPrice)]);
    if (quote.visaFee > 0) items.push(["Visa Fee", formatINR(quote.visaFee)]);
    if (quote.insuranceFee > 0) items.push(["Insurance", formatINR(quote.insuranceFee)]);
    if (quote.taxes > 0) items.push(["Taxes & Surcharges", formatINR(quote.taxes)]);
    if (quote.serviceFee > 0) items.push(["Service Fee", formatINR(quote.serviceFee)]);
    if (quote.platformFee > 0)
        items.push(["TravelsTREM platform fee", formatINR(quote.platformFee)]);
    if (quote.agentMarkup > 0) items.push(["Agent Markup", formatINR(quote.agentMarkup)]);

    if (quote.items?.length) {
        quote.items
            .filter((item) => !item.code && (!item.optional || item.selected))
            .forEach((item) => {
                items.push([item.label || "Item", formatINR(item.amount)]);
            });
    }

    if (quote.discount > 0) items.push(["Discount", `-${formatINR(quote.discount)}`]);
    if (quote.couponDiscount > 0)
        items.push(["Coupon Discount", `-${formatINR(quote.couponDiscount)}`]);

    const tableTop = doc.y;
    doc.fontSize(9);
    items.forEach(([label, amount], i) => {
        const y = tableTop + i * 18;
        doc.font("Helvetica").fillColor("#333").text(label, 60, y, { width: 300 });
        doc.font("Helvetica")
            .fillColor("#000")
            .text(amount, 380, y, { align: "right", width: 120 });
        if (i < items.length - 1) {
            doc.moveTo(60, y + 16)
                .lineTo(540, y + 16)
                .strokeColor("#f5f5f5")
                .stroke();
        }
    });

    const totalY = tableTop + items.length * 18 + 6;
    doc.moveTo(60, totalY).lineTo(540, totalY).strokeColor("#ddd").stroke();
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#000");
    doc.text("Total Amount", 60, totalY + 8, { width: 300 });
    doc.text(formatINR(quote.finalAmount), 380, totalY + 8, { align: "right", width: 120 });

    const paymentY = totalY + 42;
    doc.fontSize(10).font("Helvetica-Bold").text("Payment summary", 60, paymentY);
    doc.fontSize(9)
        .font("Helvetica")
        .text("Amount payable now", 60, paymentY + 18, { width: 250 });
    doc.text(formatINR(quote.amountPayableNow || 0), 380, paymentY + 18, {
        align: "right",
        width: 120,
    });
    doc.text("Remaining balance", 60, paymentY + 34, { width: 250 });
    doc.text(
        formatINR(
            Math.max(0, Number(quote.finalAmount || 0) - Number(quote.amountPayableNow || 0)),
        ),
        380,
        paymentY + 34,
        { align: "right", width: 120 },
    );
    if (quote.balanceDueDate)
        doc.text(`Balance due: ${formatDate(quote.balanceDueDate)}`, 60, paymentY + 50, {
            width: 480,
        });

    if (quote.notes) {
        sectionTitle(doc, "Notes");
        doc.fontSize(9).font("Helvetica").fillColor("#555").text(quote.notes);
    }

    if (quote.terms) {
        sectionTitle(doc, "Terms / cancellation information");
        doc.fontSize(8).font("Helvetica").fillColor("#555").text(quote.terms);
    }

    sectionTitle(doc, "Terms & Conditions");
    doc.fontSize(8).fillColor("#777");
    doc.text(
        "1. This quote is valid until the expiration date mentioned above.\n" +
            "2. Prices are subject to change based on availability and exchange rates.\n" +
            "3. A non-refundable deposit may be required to confirm the booking.\n" +
            "4. Cancellation charges apply as per the tour's cancellation policy.\n" +
            "5. Travel insurance is recommended for all bookings.\n" +
            "6. Airfare, hotel rates, and taxes are dynamic and may vary at time of booking.",
        { align: "justify", lineGap: 2 },
    );

    footer(doc);
    doc.end();
    return doc;
}

export function pdfDocumentToBuffer(doc) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
    });
}

const formatMinorMoney = (minor, currency = "INR") =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(Number(minor || 0) / 100);

const quoteSnapshotLines = (snapshot, formatter) => [
    ...(snapshot?.base || []).map(formatter).filter(Boolean),
    ...(snapshot?.customizations || []).map(formatter).filter(Boolean).map((item) => `Customization: ${item}`),
];

const renderQuoteList = (doc, title, lines) => {
    if (!lines.length) return;
    sectionTitle(doc, title);
    doc.fontSize(9).font("Helvetica").fillColor("#333").text(lines.map((item) => `• ${item}`).join("\n"));
};

/** Renders the immutable, server-built trem-docengine quote snapshot. */
export function generateQuoteDocumentPdf(model) {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    header(doc, "TRAVEL QUOTE");
    labelValue(doc, "Enquiry:", model.enquiryRef);
    labelValue(doc, "Quote:", `${model.quoteRef} (v${model.version})`);
    labelValue(doc, "Valid until:", formatDate(model.validUntil));

    sectionTitle(doc, model.title);
    doc.fontSize(9).font("Helvetica").fillColor("#333").text(model.summary || "");
    doc.moveDown(0.4);
    labelValue(doc, "Traveller:", model.traveller?.name);
    labelValue(doc, "Email:", model.traveller?.email);
    labelValue(doc, "Travel dates:", model.travel?.dates);
    labelValue(doc, "Travellers:", model.travel?.travellers);
    labelValue(doc, "Package variant:", model.variant);

    renderQuoteList(
        doc,
        "Itinerary",
        quoteSnapshotLines(model.itinerarySnapshot, (item) =>
            `Day ${item.day}: ${item.title || item.location || "Planned journey"}${item.summary ? ` — ${item.summary}` : ""}`,
        ),
    );
    renderQuoteList(
        doc,
        "Hotels & rooms",
        quoteSnapshotLines(model.hotelSnapshot, (item) =>
            [item.propertyName || item.location || "Stay", item.roomType, item.nights ? `${item.nights} night(s)` : ""]
                .filter(Boolean)
                .join(" · "),
        ),
    );
    renderQuoteList(
        doc,
        "Transfers",
        quoteSnapshotLines(model.transferSnapshot, (item) => item.name || item.description || "Transfer service"),
    );
    renderQuoteList(
        doc,
        "Activities",
        quoteSnapshotLines(model.activitySnapshot, (item) => item.name || item.description || `Day ${item.day || ""} activity`),
    );

    sectionTitle(doc, "Price breakdown");
    (model.pricing?.lines || []).forEach((line) => {
        const basis = String(line.pricingType || "FIXED").toLowerCase().replaceAll("_", " ");
        const quantity = Number(line.quantity || 1);
        doc.fontSize(9).font("Helvetica").fillColor("#333").text(
            `${line.label} · ${basis}${quantity > 1 ? ` × ${quantity}` : ""}`,
            { continued: true },
        );
        doc.font("Helvetica-Bold").fillColor("#000").text(
            formatMinorMoney(line.amountMinor, model.pricing.currency),
            { align: "right" },
        );
        if (line.description)
            doc.fontSize(8).font("Helvetica").fillColor("#666").text(line.description);
    });
    doc.moveDown(0.3);
    doc.fontSize(12).font("Helvetica-Bold").text("Customer total", { continued: true });
    doc.text(formatMinorMoney(model.pricing.totalMinor, model.pricing.currency), {
        align: "right",
    });

    if (model.inclusions?.length) {
        sectionTitle(doc, "Inclusions");
        doc.fontSize(9).font("Helvetica").text(model.inclusions.map((item) => `• ${item}`).join("\n"));
    }
    if (model.exclusions?.length) {
        sectionTitle(doc, "Exclusions");
        doc.fontSize(9).font("Helvetica").text(model.exclusions.map((item) => `• ${item}`).join("\n"));
    }
    sectionTitle(doc, "Payment terms");
    doc.fontSize(8).font("Helvetica").text(model.terms?.payment || "");
    sectionTitle(doc, "Cancellation terms");
    doc.fontSize(8).font("Helvetica").text(model.terms?.cancellation || "");
    if (model.terms?.notes) {
        sectionTitle(doc, "Notes");
        doc.fontSize(8).font("Helvetica").text(model.terms.notes);
    }
    footer(doc);
    doc.end();
    return doc;
}

export function generateInvoicePdf(booking, payments, tour) {
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    header(doc, "PAYMENT RECEIPT / INVOICE");
    doc.moveDown(0.3);

    labelValue(doc, "Booking Ref:", booking.bookingRef);
    labelValue(doc, "Invoice Date:", formatDate(new Date()));

    const lastPayment = payments?.[0];
    if (lastPayment) {
        labelValue(doc, "Payment Date:", formatDate(lastPayment.paymentDate));
        labelValue(doc, "Transaction ID:", lastPayment.transactionId || ",");
        labelValue(doc, "Payment Method:", lastPayment.provider || lastPayment.method || ",");
    }
    doc.moveDown(0.5);

    sectionTitle(doc, "Customer Details");
    labelValue(doc, "Name:", booking.primaryContact?.name || ",");
    labelValue(doc, "Email:", booking.primaryContact?.email || ",");
    labelValue(doc, "Phone:", booking.primaryContact?.phone || ",");

    sectionTitle(doc, "Booking Details");
    labelValue(doc, "Tour:", tour?.title || ",");
    labelValue(doc, "Destination:", `${tour?.city?.from || ","} → ${tour?.city?.to || ","}`);
    labelValue(doc, "Dates:", `${formatDate(booking.startDate)} , ${formatDate(booking.endDate)}`);
    labelValue(doc, "Guests:", String(booking.guestsCount || 1));

    sectionTitle(doc, "Payment Summary");

    const { paymentSummary } = booking;
    const total = paymentSummary?.total || booking.priceSnapshot?.total || 0;
    const paid = paymentSummary?.paid || 0;
    const remaining = paymentSummary?.remaining || 0;
    const refunded = paymentSummary?.refunded || 0;

    const pt = doc.y;
    const rows = [
        ["Total Amount", formatINR(total)],
        ["Amount Paid", formatINR(paid)],
    ];
    if (remaining > 0) rows.push(["Balance Due", formatINR(remaining)]);
    if (refunded > 0) rows.push(["Refunded", formatINR(refunded)]);

    doc.fontSize(9);
    rows.forEach(([label, amount], i) => {
        const y = pt + i * 18;
        doc.font("Helvetica").fillColor("#333").text(label, 60, y, { width: 300 });
        doc.font("Helvetica")
            .fillColor("#000")
            .text(amount, 380, y, { align: "right", width: 120 });
        if (i < rows.length - 1) {
            doc.moveTo(60, y + 16)
                .lineTo(540, y + 16)
                .strokeColor("#f5f5f5")
                .stroke();
        }
    });

    const endY = pt + rows.length * 18 + 6;
    if (rows.length > 0) {
        doc.moveTo(60, endY).lineTo(540, endY).strokeColor("#ddd").stroke();
        doc.fontSize(12).font("Helvetica-Bold").fillColor("#000");
        doc.text("Status", 60, endY + 8, { width: 300 });
        doc.font("Helvetica").fillColor(remaining > 0 ? "#e67e22" : "#27ae60");
        doc.text(
            remaining > 0
                ? `PARTIALLY PAID (₹${remaining.toLocaleString("en-IN")} due)`
                : "PAID IN FULL",
            380,
            endY + 8,
            { align: "right", width: 120 },
        );
    }

    if (payments?.length) {
        sectionTitle(doc, "Payment History");
        doc.fontSize(9).font("Helvetica-Bold").fillColor("#555");
        doc.text("Date", 60, doc.y, { width: 100 });
        doc.text("Method", 170, doc.y, { width: 100 });
        doc.text("Transaction ID", 280, doc.y, { width: 130 });
        doc.text("Amount", 460, doc.y, { align: "right", width: 80 });
        doc.moveDown(0.2);
        doc.moveTo(60, doc.y).lineTo(540, doc.y).strokeColor("#ddd").stroke();
        doc.moveDown(0.2);

        doc.font("Helvetica").fillColor("#333");
        payments.slice(0, 10).forEach((pmt) => {
            doc.text(formatDate(pmt.paymentDate), 60, doc.y, { width: 100 });
            doc.text(pmt.provider || pmt.method || ",", 170, doc.y, { width: 100 });
            doc.text(pmt.transactionId || ",", 280, doc.y, { width: 130 });
            doc.text(formatINR(pmt.amount), 460, doc.y, { align: "right", width: 80 });
            doc.moveDown(0.3);
        });
    }

    footer(doc);
    doc.end();
    return doc;
}

export function generateBookingPassPdf(booking, travelers, tour) {
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    header(doc, "BOOKING VOUCHER / PASS");
    doc.moveDown(0.3);

    doc.fontSize(10).font("Helvetica-Bold").fillColor("#e67e22");
    doc.text(`STATUS: ${booking.status}`, { align: "center" });
    doc.fillColor("#000");
    doc.moveDown(0.3);

    doc.fontSize(20).font("Helvetica-Bold").fillColor("#222");
    doc.text(booking.bookingRef, { align: "center" });
    doc.fillColor("#000");
    doc.moveDown(0.5);

    sectionTitle(doc, "Tour Information");
    labelValue(doc, "Tour:", tour?.title || ",");
    labelValue(doc, "Destination:", `${tour?.city?.from || ","} → ${tour?.city?.to || ","}`);
    labelValue(
        doc,
        "Travel Dates:",
        `${formatDate(booking.startDate)} , ${formatDate(booking.endDate)}`,
    );
    labelValue(
        doc,
        "Duration:",
        `${booking.period?.days || ","} Days / ${booking.period?.nights || ","} Nights`,
    );
    labelValue(
        doc,
        "Meeting Point:",
        tour?.meetingPoint || booking.meetingPoint || "To be confirmed",
    );
    doc.moveDown(0.3);

    if (tour?.address) {
        const a = tour.address;
        labelValue(
            doc,
            "Location:",
            [a.line1, a.line2, a.city, a.state, a.zip].filter(Boolean).join(", "),
        );
    }

    sectionTitle(doc, "Primary Contact");
    labelValue(doc, "Name:", booking.primaryContact?.name || ",");
    labelValue(doc, "Email:", booking.primaryContact?.email || ",");
    labelValue(doc, "Phone:", booking.primaryContact?.phone || ",");

    sectionTitle(doc, "Travelers");
    if (travelers?.length) {
        doc.fontSize(9);
        travelers.forEach((t, i) => {
            const name = `${t.firstName || ""} ${t.lastName || ""}`.trim() || ",";
            doc.font("Helvetica-Bold")
                .fillColor("#333")
                .text(`${i + 1}. ${name}`);
            doc.font("Helvetica").fillColor("#666");
            const details = [];
            if (t.nationality) details.push(`Nationality: ${t.nationality}`);
            if (t.age != null) details.push(`Age: ${t.age}`);
            if (t.passportNumber) details.push(`Passport: ${t.passportNumber}`);
            doc.text(details.join("  |  "));
            doc.moveDown(0.2);
        });
    } else {
        doc.fontSize(9).fillColor("#999").text("No traveler details available.");
    }

    if (tour?.highlights?.length) {
        sectionTitle(doc, "Highlights");
        doc.fontSize(9).font("Helvetica").fillColor("#555");
        tour.highlights.forEach((h) => {
            doc.text(`• ${h.title}${h.short ? ` , ${h.short}` : ""}`);
        });
    }

    sectionTitle(doc, "Emergency Contact");
    doc.fontSize(9).font("Helvetica").fillColor("#333");
    doc.text(`${COMPANY.name} Emergency Support`);
    doc.text(`Phone: ${COMPANY.phone}`);
    doc.text(`Email: ${COMPANY.email}`);
    doc.moveDown(0.3);
    doc.fontSize(8)
        .fillColor("#999")
        .text("In case of emergency during the tour, please contact the above number immediately.");

    sectionTitle(doc, "Important Notes");
    doc.fontSize(8).fillColor("#777");
    doc.text(
        "• Please arrive at the meeting point 15 minutes before the scheduled start time.\n" +
            "• Carry a valid government-issued photo ID (original) for all travelers.\n" +
            "• Keep this voucher handy during the tour for verification.\n" +
            "• Cancellation policy applies as per the terms agreed at the time of booking.\n" +
            `• For any changes or assistance, contact ${COMPANY.phone} or email ${COMPANY.email}.`,
        { align: "justify", lineGap: 2 },
    );

    footer(doc);
    doc.end();
    return doc;
}
