import BookingQuote from "../models/BookingQuote.js";
import {
    latestQuoteDocument,
    getQuoteDocumentSignedUrl,
    readQuoteDocument,
} from "../services/QuoteDocumentStorage.js";

function sendError(res, message, status = 400) {
    return res.status(status).json({ status: "error", message });
}

function canAccessQuote(req, quote) {
    const userId = String(req.user?.sub || req.user?.id || req.user?._id || "");
    const role = String(req.user?.role || "").toLowerCase();
    if (!userId) return false;
    if (["admin", "agent", "super_admin"].includes(role)) return true;
    return [quote.userId, quote.createdBy].some((value) => value && String(value) === userId);
}

// Quote-centric document endpoint. It returns only a short-lived URL and keeps
// storage keys and credentials private. The future booking engine can reuse it
// without inheriting any legacy booking orchestration.
export async function getQuotePdfSignedUrl(req, res) {
    try {
        const quote = await BookingQuote.findById(req.params.quoteId).lean();
        if (!quote) return sendError(res, "Quote not found", 404);
        if (!canAccessQuote(req, quote))
            return sendError(res, "Not authorized to download this quote", 403);
        if (!quote.bookingId || quote.version == null)
            return sendError(res, "The generated quote PDF is unavailable", 404);

        const quoteDocument = await latestQuoteDocument(quote.bookingId, quote.version);
        if (!quoteDocument?.storageKey && !quoteDocument?.url) {
            return sendError(res, "The generated quote PDF is unavailable", 404);
        }

        if (quoteDocument.storageProvider === "LOCAL_PRIVATE") {
            return res.json({
                status: "success",
                data: {
                    url: `/api/quotes/${quote.id || quote._id}/pdf/file`,
                    expiresIn: null,
                    fileName: quoteDocument.fileName,
                },
            });
        }

        const signedUrl = await getQuoteDocumentSignedUrl(quoteDocument);
        if (!signedUrl) return sendError(res, "Unable to generate download URL", 500);
        return res.json({
            status: "success",
            data: {
                url: signedUrl.url,
                expiresIn: signedUrl.expiresIn,
                fileName: quoteDocument.fileName,
            },
        });
    } catch (error) {
        console.error("getQuotePdfSignedUrl error:", error);
        return sendError(res, "Failed to generate quote download URL", 500);
    }
}

export async function downloadQuotePdf(req, res) {
    try {
        const quote = await BookingQuote.findById(req.params.quoteId).lean();
        if (!quote) return sendError(res, "Quote not found", 404);
        if (!canAccessQuote(req, quote))
            return sendError(res, "Not authorized to download this quote", 403);
        const document = await latestQuoteDocument(quote.bookingId, quote.version);
        const buffer = await readQuoteDocument(document);
        if (!buffer) return sendError(res, "The generated quote PDF is unavailable", 404);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `inline; filename="${String(document.fileName || "quote.pdf").replace(/[\r\n"]/g, "")}"`,
        );
        res.setHeader("Cache-Control", "private, no-store");
        return res.send(buffer);
    } catch (error) {
        console.error("downloadQuotePdf error:", error);
        return sendError(res, "Failed to download quote", 500);
    }
}
