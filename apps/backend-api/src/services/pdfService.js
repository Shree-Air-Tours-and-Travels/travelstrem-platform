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

const QUOTE_THEME = Object.freeze({
    primary: "#2847A8",
    primaryDark: "#1B2F78",
    secondary: "#7540C9",
    tertiary: "#B82F6F",
    ink: "#181A2D",
    muted: "#606579",
    border: "#E1E5F1",
    surface: "#F8F9FD",
    primarySoft: "#EEF1FC",
    secondarySoft: "#F4EEFC",
    successSoft: "#EDF7F3",
    success: "#18745B",
    dangerSoft: "#FCEFF3",
    danger: "#B82F5A",
    white: "#FFFFFF",
});

const QUOTE_PAGE = Object.freeze({ left: 42, right: 553, width: 511, contentBottom: 770 });

const formatMinorMoney = (minor, currency = "INR") => {
    const code = String(currency || "INR").toUpperCase();
    const value = new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(minor || 0) / 100);
    return `${code} ${value}`;
};

const quoteSnapshotItems = (snapshot, formatter) => [
    ...(snapshot?.base || [])
        .map(formatter)
        .filter(Boolean)
        .map((text) => ({ text, customized: false })),
    ...(snapshot?.customizations || [])
        .map(formatter)
        .filter(Boolean)
        .map((text) => ({ text, customized: true })),
];

const quoteText = (value, fallback = "Not specified") => {
    const normalized = String(value ?? "").trim();
    return normalized || fallback;
};

const formatTravelDates = (value) => {
    const text = quoteText(value, "Flexible dates");
    const isoDates = text.match(/\d{4}-\d{2}-\d{2}/g) || [];
    if (!isoDates.length) return text;
    const formatted = isoDates.map((date) => formatDate(`${date}T00:00:00`));
    return formatted.length > 1 ? `${formatted[0]} to ${formatted.at(-1)}` : formatted[0];
};

const drawQuoteContinuationHeader = (doc, model) => {
    doc.rect(0, 0, doc.page.width, 64).fill(QUOTE_THEME.primaryDark);
    doc.roundedRect(QUOTE_PAGE.left, 18, 28, 28, 7).fill(QUOTE_THEME.white);
    doc.font("Helvetica-Bold").fontSize(14).fillColor(QUOTE_THEME.primary).text("T", 42, 25, {
        width: 28,
        align: "center",
    });
    doc.font("Helvetica-Bold").fontSize(12).fillColor(QUOTE_THEME.white).text(
        COMPANY.name || "TravelsTREM",
        80,
        20,
    );
    doc.font("Helvetica").fontSize(7).fillColor("#D9DFF7").text("TRAVEL QUOTATION", 80, 36);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(QUOTE_THEME.white).text(
        model.quoteRef,
        365,
        27,
        { width: 188, align: "right" },
    );
    doc.y = 82;
};

const ensureQuoteSpace = (doc, model, height) => {
    if (doc.y + height <= QUOTE_PAGE.contentBottom) return;
    doc.addPage();
    drawQuoteContinuationHeader(doc, model);
};

const drawQuoteSectionHeading = (doc, model, title, eyebrow = "", minimumContentHeight = 0) => {
    if (doc.y > 95) doc.y += 22;
    ensureQuoteSpace(doc, model, (eyebrow ? 62 : 50) + minimumContentHeight);
    const y = doc.y;
    doc.roundedRect(QUOTE_PAGE.left, y, 5, eyebrow ? 35 : 25, 2).fill(QUOTE_THEME.secondary);
    if (eyebrow) {
        doc.font("Helvetica-Bold").fontSize(7).fillColor(QUOTE_THEME.secondary).text(
            eyebrow.toUpperCase(),
            58,
            y,
            { characterSpacing: 0.8 },
        );
    }
    doc.font("Helvetica-Bold").fontSize(15).fillColor(QUOTE_THEME.ink).text(
        title,
        58,
        y + (eyebrow ? 12 : 3),
        { width: 495 },
    );
    doc.y = y + (eyebrow ? 55 : 45);
};

const drawQuoteFact = (doc, { x, y, width, label, value }) => {
    doc.font("Helvetica-Bold").fontSize(7).fillColor(QUOTE_THEME.muted).text(
        String(label).toUpperCase(),
        x,
        y,
        { width, characterSpacing: 0.45 },
    );
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(QUOTE_THEME.ink).text(
        quoteText(value),
        x,
        y + 13,
        { width, height: 30, ellipsis: true },
    );
};

const drawQuoteListSection = (doc, model, title, items, options = {}) => {
    if (!items.length) return;
    drawQuoteSectionHeading(doc, model, title, options.eyebrow || "Trip details", 44);
    items.forEach((item) => {
        const text = typeof item === "string" ? item : item.text;
        const customized = typeof item === "object" && item.customized;
        doc.font("Helvetica").fontSize(9);
        const textHeight = doc.heightOfString(text, { width: 448, lineGap: 2 });
        const rowHeight = Math.max(34, textHeight + 16);
        ensureQuoteSpace(doc, model, rowHeight + 6);
        const y = doc.y;
        doc.roundedRect(QUOTE_PAGE.left, y, QUOTE_PAGE.width, rowHeight, 8).fill(
            customized ? QUOTE_THEME.secondarySoft : QUOTE_THEME.surface,
        );
        doc.circle(57, y + 17, 4).fill(customized ? QUOTE_THEME.secondary : QUOTE_THEME.primary);
        if (customized) {
            doc.font("Helvetica-Bold").fontSize(6.5).fillColor(QUOTE_THEME.secondary).text(
                "CUSTOM",
                69,
                y + 8,
                { width: 55, characterSpacing: 0.5 },
            );
        }
        doc.font("Helvetica").fontSize(9).fillColor(QUOTE_THEME.ink).text(
            text,
            69,
            y + (customized ? 18 : 11),
            { width: 468, lineGap: 2 },
        );
        doc.y = y + rowHeight + 6;
    });
    doc.y += 4;
};

const drawQuoteBullets = (doc, model, title, items, tone) => {
    if (!items?.length) return;
    const palette = tone === "danger"
        ? { fill: QUOTE_THEME.dangerSoft, accent: QUOTE_THEME.danger }
        : { fill: QUOTE_THEME.successSoft, accent: QUOTE_THEME.success };
    drawQuoteSectionHeading(doc, model, title, "What to expect", 46);
    for (let index = 0; index < items.length; index += 2) {
        const pair = items.slice(index, index + 2).map((item) => quoteText(item));
        doc.font("Helvetica").fontSize(8.5);
        const heights = pair.map((item) => doc.heightOfString(item, { width: 205, lineGap: 2 }));
        const rowHeight = Math.max(30, ...heights.map((height) => height + 16));
        ensureQuoteSpace(doc, model, rowHeight + 6);
        const y = doc.y;
        pair.forEach((item, pairIndex) => {
            const x = QUOTE_PAGE.left + pairIndex * 258;
            const width = pairIndex === 0 ? 250 : 253;
            doc.roundedRect(x, y, width, rowHeight, 8).fill(palette.fill);
            doc.circle(x + 14, y + 15, 4).fill(palette.accent);
            doc.font("Helvetica").fontSize(8.5).fillColor(QUOTE_THEME.ink).text(
                item,
                x + 26,
                y + 10,
                { width: width - 38, lineGap: 2 },
            );
        });
        doc.y = y + rowHeight + 6;
    }
    doc.y += 4;
};

const drawQuoteTerms = (doc, model, title, value) => {
    const terms = String(value || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
    if (!terms.length) return;
    drawQuoteSectionHeading(doc, model, title, "Important information", 42);
    terms.forEach((term, index) => {
        doc.font("Helvetica").fontSize(8.5);
        const height = Math.max(30, doc.heightOfString(term, { width: 450, lineGap: 2 }) + 14);
        ensureQuoteSpace(doc, model, height + 5);
        const y = doc.y;
        doc.roundedRect(QUOTE_PAGE.left, y, QUOTE_PAGE.width, height, 8).fill(QUOTE_THEME.surface);
        doc.roundedRect(52, y + 8, 20, 20, 6).fill(QUOTE_THEME.primarySoft);
        doc.font("Helvetica-Bold").fontSize(8).fillColor(QUOTE_THEME.primary).text(
            String(index + 1),
            52,
            y + 14,
            { width: 20, align: "center" },
        );
        doc.font("Helvetica").fontSize(8.5).fillColor(QUOTE_THEME.ink).text(
            term,
            82,
            y + 10,
            { width: 455, lineGap: 2 },
        );
        doc.y = y + height + 5;
    });
    doc.y += 4;
};

const quoteTermLines = (value) =>
    String(value || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

const drawPaymentSchedule = (doc, model, value) => {
    const rows = quoteTermLines(value).map((line) => {
        const match = line.match(/^([^:]+):\s*(.+?)\s+due\s+(.+)$/i);
        return match
            ? { milestone: match[1], amount: match[2], due: match[3] }
            : { milestone: "Payment", amount: line, due: "As confirmed" };
    });
    if (!rows.length) return;
    drawQuoteSectionHeading(doc, model, "Payment schedule", "Important information", 72);
    ensureQuoteSpace(doc, model, 34 + rows.length * 46);
    let y = doc.y;
    doc.roundedRect(QUOTE_PAGE.left, y, QUOTE_PAGE.width, 28, 8).fill(QUOTE_THEME.ink);
    doc.font("Helvetica-Bold").fontSize(7).fillColor(QUOTE_THEME.white);
    doc.text("MILESTONE", 58, y + 10, { width: 190, characterSpacing: 0.45 });
    doc.text("AMOUNT", 255, y + 10, { width: 105, characterSpacing: 0.45 });
    doc.text("DUE", 370, y + 10, { width: 167, characterSpacing: 0.45 });
    y += 34;
    rows.forEach((row, index) => {
        const height = 42;
        doc.roundedRect(QUOTE_PAGE.left, y, QUOTE_PAGE.width, height, 7).fill(
            index % 2 ? QUOTE_THEME.white : QUOTE_THEME.surface,
        );
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(QUOTE_THEME.ink).text(
            row.milestone,
            58,
            y + 13,
            { width: 185 },
        );
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(QUOTE_THEME.primary).text(
            row.amount,
            255,
            y + 13,
            { width: 105 },
        );
        doc.font("Helvetica").fontSize(8).fillColor(QUOTE_THEME.ink).text(
            row.due,
            370,
            y + 12,
            { width: 167, height: 24, ellipsis: true },
        );
        y += height + 3;
    });
    doc.y = y + 6;
};

const drawCancellationPolicy = (doc, model, value) => {
    const rows = quoteTermLines(value).map((line) => {
        const match = line.match(/^([^:]+):\s*(\d+(?:\.\d+)?)%\s+refund\s*[—-]\s*(.*)$/i);
        return match
            ? { window: match[1], refund: `${match[2]}%`, details: match[3] }
            : { window: "Policy condition", refund: "—", details: line };
    });
    if (!rows.length) return;

    doc.font("Helvetica").fontSize(8);
    const rowHeights = rows.map((row) =>
        Math.max(42, doc.heightOfString(row.details, { width: 245, lineGap: 2 }) + 20),
    );
    const sectionHeight = 84 + rowHeights.reduce((sum, height) => sum + height + 3, 0);
    if (sectionHeight < QUOTE_PAGE.contentBottom - 82 && doc.y + 22 + sectionHeight > QUOTE_PAGE.contentBottom) {
        doc.addPage();
        drawQuoteContinuationHeader(doc, model);
    }

    drawQuoteSectionHeading(doc, model, "Cancellation policy", "Important information", 64);
    let y = doc.y;
    doc.roundedRect(QUOTE_PAGE.left, y, QUOTE_PAGE.width, 28, 8).fill(QUOTE_THEME.ink);
    doc.font("Helvetica-Bold").fontSize(7).fillColor(QUOTE_THEME.white);
    doc.text("CANCELLATION WINDOW", 58, y + 10, { width: 150, characterSpacing: 0.4 });
    doc.text("REFUND", 218, y + 10, { width: 72, characterSpacing: 0.4 });
    doc.text("CONDITIONS", 300, y + 10, { width: 237, characterSpacing: 0.4 });
    y += 34;
    rows.forEach((row, index) => {
        const height = rowHeights[index];
        doc.roundedRect(QUOTE_PAGE.left, y, QUOTE_PAGE.width, height, 7).fill(
            index % 2 ? QUOTE_THEME.white : QUOTE_THEME.surface,
        );
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(QUOTE_THEME.ink).text(
            row.window,
            58,
            y + 12,
            { width: 150, height: height - 18, ellipsis: true },
        );
        doc.roundedRect(218, y + 9, 62, 23, 7).fill(
            row.refund === "0%" ? QUOTE_THEME.dangerSoft : QUOTE_THEME.successSoft,
        );
        doc.font("Helvetica-Bold").fontSize(8).fillColor(
            row.refund === "0%" ? QUOTE_THEME.danger : QUOTE_THEME.success,
        ).text(row.refund, 218, y + 17, { width: 62, align: "center" });
        doc.font("Helvetica").fontSize(8).fillColor(QUOTE_THEME.ink).text(
            row.details,
            300,
            y + 10,
            { width: 237, lineGap: 2 },
        );
        y += height + 3;
    });
    doc.y = y + 6;
};

/** Renders the immutable, server-built trem-docengine quote snapshot. */
export function generateQuoteDocumentPdf(model) {
    const doc = new PDFDocument({ margin: QUOTE_PAGE.left, size: "A4", bufferPages: true });
    const pageWidth = doc.page.width;

    doc.rect(0, 0, pageWidth, 160).fill(QUOTE_THEME.primaryDark);
    doc.circle(pageWidth - 30, 15, 105).fillOpacity(0.15).fill(QUOTE_THEME.secondary);
    doc.circle(pageWidth - 118, 127, 42).fillOpacity(0.12).fill(QUOTE_THEME.tertiary);
    doc.fillOpacity(1);

    doc.roundedRect(QUOTE_PAGE.left, 28, 38, 38, 10).fill(QUOTE_THEME.white);
    doc.font("Helvetica-Bold").fontSize(20).fillColor(QUOTE_THEME.primary).text("T", 42, 37, {
        width: 38,
        align: "center",
    });
    doc.font("Helvetica-Bold").fontSize(17).fillColor(QUOTE_THEME.white).text(
        COMPANY.name || "TravelsTREM",
        92,
        30,
    );
    doc.font("Helvetica").fontSize(7.5).fillColor("#D9DFF7").text(
        COMPANY.tagline || "Your journey, thoughtfully planned",
        92,
        52,
    );
    doc.roundedRect(430, 31, 123, 27, 13).fillOpacity(0.16).fill(QUOTE_THEME.white);
    doc.fillOpacity(1);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(QUOTE_THEME.white).text(
        "TRAVEL QUOTATION",
        430,
        41,
        { width: 123, align: "center", characterSpacing: 0.7 },
    );

    doc.font("Helvetica-Bold").fontSize(22).fillColor(QUOTE_THEME.white).text(
        quoteText(model.title, "Your tailored journey"),
        QUOTE_PAGE.left,
        90,
        { width: 480, height: 55, ellipsis: true },
    );

    const referenceY = 132;
    doc.roundedRect(QUOTE_PAGE.left, referenceY, QUOTE_PAGE.width, 68, 12)
        .fillAndStroke(QUOTE_THEME.white, QUOTE_THEME.border);
    const referenceFacts = [
        { label: "Quote reference", value: `${model.quoteRef}  |  V${model.version || 1}` },
        { label: "Enquiry", value: model.enquiryRef },
        { label: "Valid until", value: formatDate(model.validUntil) },
    ];
    referenceFacts.forEach((fact, index) => {
        const x = 58 + index * 166;
        drawQuoteFact(doc, { x, y: referenceY + 16, width: 145, ...fact });
        if (index < referenceFacts.length - 1)
            doc.moveTo(x + 151, referenceY + 15)
                .lineTo(x + 151, referenceY + 53)
                .strokeColor(QUOTE_THEME.border)
                .stroke();
    });

    doc.y = 224;
    drawQuoteSectionHeading(doc, model, "Your journey at a glance", "Prepared for you");
    const summary = quoteText(model.summary, "A personalized travel plan prepared around your request.");
    doc.font("Helvetica").fontSize(9.5);
    const summaryHeight = Math.max(54, doc.heightOfString(summary, { width: 479, lineGap: 3 }) + 26);
    ensureQuoteSpace(doc, model, summaryHeight + 12);
    const summaryY = doc.y;
    doc.roundedRect(QUOTE_PAGE.left, summaryY, QUOTE_PAGE.width, summaryHeight, 10).fill(
        QUOTE_THEME.primarySoft,
    );
    doc.font("Helvetica").fontSize(9.5).fillColor(QUOTE_THEME.ink).text(
        summary,
        58,
        summaryY + 13,
        { width: 479, lineGap: 3 },
    );
    doc.y = summaryY + summaryHeight + 12;

    ensureQuoteSpace(doc, model, 132);
    const factsY = doc.y;
    doc.roundedRect(QUOTE_PAGE.left, factsY, QUOTE_PAGE.width, 112, 10)
        .fillAndStroke(QUOTE_THEME.white, QUOTE_THEME.border);
    const travelFacts = [
        { label: "Traveller", value: model.traveller?.name },
        { label: "Travel dates", value: formatTravelDates(model.travel?.dates) },
        { label: "Travellers", value: model.travel?.travellers },
        { label: "Package", value: model.travel?.packageName || model.variant },
    ];
    travelFacts.forEach((fact, index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        const x = 58 + column * 253;
        const y = factsY + 16 + row * 48;
        drawQuoteFact(doc, { x, y, width: 222, ...fact });
    });
    doc.moveTo(295, factsY + 14).lineTo(295, factsY + 98).strokeColor(QUOTE_THEME.border).stroke();
    doc.moveTo(58, factsY + 56).lineTo(537, factsY + 56).strokeColor(QUOTE_THEME.border).stroke();
    doc.y = factsY + 124;
    const contact = [model.traveller?.email, model.traveller?.phone].filter(Boolean).join("  |  ");
    if (contact) {
        doc.font("Helvetica").fontSize(8).fillColor(QUOTE_THEME.muted).text(
            `Contact: ${contact}`,
            QUOTE_PAGE.left,
            doc.y,
            { width: QUOTE_PAGE.width },
        );
        doc.y += 28;
    }

    const provider = model.provider || {};
    if (provider.agent || provider.agency) {
        drawQuoteSectionHeading(
            doc,
            model,
            "Your travel specialist",
            "Who is looking after your journey",
            132,
        );
        const providerY = doc.y;
        const providerHeight = 124;
        doc.roundedRect(QUOTE_PAGE.left, providerY, QUOTE_PAGE.width, providerHeight, 10)
            .fillAndStroke(QUOTE_THEME.white, QUOTE_THEME.border);
        doc.moveTo(295, providerY + 16)
            .lineTo(295, providerY + providerHeight - 16)
            .strokeColor(QUOTE_THEME.border)
            .stroke();

        const specialist = provider.agent || {};
        doc.font("Helvetica-Bold").fontSize(7).fillColor(QUOTE_THEME.primary).text(
            "AGENT DETAILS",
            58,
            providerY + 16,
            { width: 210, characterSpacing: 0.55 },
        );
        doc.font("Helvetica-Bold").fontSize(12).fillColor(QUOTE_THEME.ink).text(
            quoteText(specialist.name, "Your travel specialist"),
            58,
            providerY + 34,
            { width: 210 },
        );
        doc.font("Helvetica").fontSize(8).fillColor(QUOTE_THEME.muted).text(
            quoteText(specialist.designation, "Travel specialist"),
            58,
            providerY + 52,
            { width: 210 },
        );
        doc.font("Helvetica").fontSize(8).fillColor(QUOTE_THEME.ink).text(
            [specialist.email, specialist.phone].filter(Boolean).join("\n"),
            58,
            providerY + 72,
            { width: 210, lineGap: 3 },
        );

        const agency = provider.agency || {};
        doc.font("Helvetica-Bold").fontSize(7).fillColor(QUOTE_THEME.secondary).text(
            "AGENCY DETAILS",
            315,
            providerY + 16,
            { width: 220, characterSpacing: 0.55 },
        );
        doc.font("Helvetica-Bold").fontSize(12).fillColor(QUOTE_THEME.ink).text(
            quoteText(agency.name, COMPANY.name || "TravelsTREM"),
            315,
            providerY + 34,
            { width: 220 },
        );
        if (agency.contactName)
            doc.font("Helvetica").fontSize(7.5).fillColor(QUOTE_THEME.muted).text(
                `Contact: ${agency.contactName}`,
                315,
                providerY + 52,
                { width: 220 },
            );
        doc.font("Helvetica").fontSize(8).fillColor(QUOTE_THEME.ink).text(
            [agency.email, agency.phone].filter(Boolean).join("\n"),
            315,
            providerY + 70,
            { width: 220, height: 36, lineGap: 3, ellipsis: true },
        );
        doc.y = providerY + providerHeight + 24;
    }

    const itinerary = quoteSnapshotItems(model.itinerarySnapshot, (item) =>
        `Day ${item.day || "-"}  |  ${item.title || item.location || "Planned journey"}${item.summary ? ` — ${item.summary}` : ""}`,
    );
    drawQuoteListSection(doc, model, "Day-by-day itinerary", itinerary, { eyebrow: "Your journey" });

    drawQuoteListSection(
        doc,
        model,
        "Hotels & rooms",
        quoteSnapshotItems(model.hotelSnapshot, (item) =>
            [
                item.propertyName || item.location || "Stay",
                item.roomType,
                item.nights ? `${item.nights} night${Number(item.nights) === 1 ? "" : "s"}` : "",
            ]
                .filter(Boolean)
                .join("  |  "),
        ),
    );
    drawQuoteListSection(
        doc,
        model,
        "Transfers",
        quoteSnapshotItems(
            model.transferSnapshot,
            (item) => item.name || item.description || "Transfer service",
        ),
    );
    drawQuoteListSection(
        doc,
        model,
        "Activities & experiences",
        quoteSnapshotItems(
            model.activitySnapshot,
            (item) => item.name || item.description || `Day ${item.day || "-"} activity`,
        ),
    );

    doc.addPage();
    drawQuoteContinuationHeader(doc, model);
    drawQuoteSectionHeading(doc, model, "Your investment", "Transparent pricing");
    const pricingLines = [...(model.pricing?.lines || [])].sort((left, right) => {
        const isClosingLine = (line) =>
            ["TREM_FEE", "TREM_FEE_GST"].includes(String(line.code || "").toUpperCase()) ||
            /^agent\s+(quote|quotation)$/i.test(String(line.label || "").trim());
        return Number(isClosingLine(left)) - Number(isClosingLine(right));
    });
    const drawPricingHeader = () => {
        ensureQuoteSpace(doc, model, 38);
        const y = doc.y;
        doc.roundedRect(QUOTE_PAGE.left, y, QUOTE_PAGE.width, 28, 8).fill(QUOTE_THEME.ink);
        doc.font("Helvetica-Bold").fontSize(7).fillColor(QUOTE_THEME.white).text(
            "SERVICE",
            57,
            y + 10,
            { width: 330, characterSpacing: 0.5 },
        );
        doc.text("AMOUNT", 405, y + 10, { width: 132, align: "right", characterSpacing: 0.5 });
        doc.y = y + 34;
    };
    drawPricingHeader();
    pricingLines.forEach((line, index) => {
        const basis = String(line.pricingType || "FIXED").toLowerCase().replaceAll("_", " ");
        const quantity = Number(line.quantity || 1);
        const detail = [
            `${basis}${quantity > 1 ? ` x ${quantity}` : ""}`,
            line.description,
        ].filter(Boolean).join("  |  ");
        doc.font("Helvetica").fontSize(7.5);
        const detailHeight = doc.heightOfString(detail, { width: 330, lineGap: 1 });
        const rowHeight = Math.max(38, detailHeight + 27);
        if (doc.y + rowHeight > QUOTE_PAGE.contentBottom) {
            doc.addPage();
            drawQuoteContinuationHeader(doc, model);
            drawPricingHeader();
        }
        const y = doc.y;
        doc.roundedRect(QUOTE_PAGE.left, y, QUOTE_PAGE.width, rowHeight, 7).fill(
            index % 2 ? QUOTE_THEME.white : QUOTE_THEME.surface,
        );
        doc.font("Helvetica-Bold").fontSize(9).fillColor(QUOTE_THEME.ink).text(
            quoteText(line.label, "Travel service"),
            57,
            y + 8,
            { width: 330 },
        );
        doc.font("Helvetica").fontSize(7.5).fillColor(QUOTE_THEME.muted).text(
            detail,
            57,
            y + 21,
            { width: 330, lineGap: 1 },
        );
        doc.font("Helvetica-Bold").fontSize(9).fillColor(QUOTE_THEME.ink).text(
            formatMinorMoney(line.amountMinor, model.pricing.currency),
            405,
            y + 12,
            { width: 132, align: "right" },
        );
        doc.y = y + rowHeight + 3;
    });
    ensureQuoteSpace(doc, model, 78);
    const totalY = doc.y + 5;
    doc.roundedRect(QUOTE_PAGE.left, totalY, QUOTE_PAGE.width, 62, 10).fill(QUOTE_THEME.primary);
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#DDE4FF").text(
        "TOTAL QUOTATION VALUE",
        58,
        totalY + 14,
        { width: 230, characterSpacing: 0.6 },
    );
    doc.font("Helvetica").fontSize(7.5).fillColor("#DDE4FF").text(
        "Final amount for the selected services",
        58,
        totalY + 32,
        { width: 250 },
    );
    doc.font("Helvetica-Bold").fontSize(16).fillColor(QUOTE_THEME.white).text(
        formatMinorMoney(model.pricing?.totalMinor, model.pricing?.currency),
        315,
        totalY + 21,
        { width: 222, align: "right" },
    );
    doc.y = totalY + 78;

    drawQuoteBullets(doc, model, "Included in your quotation", model.inclusions, "success");
    drawQuoteBullets(doc, model, "Not included", model.exclusions, "danger");
    drawPaymentSchedule(doc, model, model.terms?.payment);
    drawCancellationPolicy(doc, model, model.terms?.cancellation);
    drawQuoteTerms(doc, model, "Additional notes", model.terms?.notes);

    ensureQuoteSpace(doc, model, 74);
    const closingY = doc.y + 8;
    doc.roundedRect(QUOTE_PAGE.left, closingY, QUOTE_PAGE.width, 56, 10).fill(
        QUOTE_THEME.secondarySoft,
    );
    doc.font("Helvetica-Bold").fontSize(11).fillColor(QUOTE_THEME.secondary).text(
        "Ready when you are",
        58,
        closingY + 12,
    );
    doc.font("Helvetica").fontSize(8).fillColor(QUOTE_THEME.ink).text(
        "Review this quotation in My Bookings to accept it or request changes from your travel specialist.",
        58,
        closingY + 29,
        { width: 465 },
    );

    const generatedAt = model.generatedAt ? new Date(model.generatedAt) : new Date();
    const generatedLabel = Number.isNaN(generatedAt.getTime())
        ? ""
        : generatedAt.toLocaleDateString("en-IN", { dateStyle: "medium" });
    const range = doc.bufferedPageRange();
    for (let pageIndex = range.start; pageIndex < range.start + range.count; pageIndex += 1) {
        doc.switchToPage(pageIndex);
        doc.moveTo(QUOTE_PAGE.left, 786)
            .lineTo(QUOTE_PAGE.right, 786)
            .strokeColor(QUOTE_THEME.border)
            .stroke();
        doc.font("Helvetica").fontSize(6.5).fillColor(QUOTE_THEME.muted).text(
            [COMPANY.name, COMPANY.email, COMPANY.phone].filter(Boolean).join("  |  "),
            QUOTE_PAGE.left,
            792,
            { width: 350 },
        );
        doc.text(
            `${generatedLabel ? `Generated ${generatedLabel}  |  ` : ""}Page ${pageIndex + 1} of ${range.count}`,
            390,
            792,
            { width: 163, align: "right" },
        );
    }

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
