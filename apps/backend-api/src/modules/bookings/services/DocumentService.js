import fs from "fs/promises";
import path from "path";
import BookingDocument from "../models/BookingDocument.js";
import { DOCUMENT_STATUS, DOCUMENT_TYPE } from "../../../constants/enums.js";
import DocumentStorageService from "../../../services/r2/DocumentStorageService.js";
import { generateQuoteDocumentKey } from "../../../services/r2/objectKey.js";
import { privateQuoteUploadDirectory } from "./QuoteDocumentStorage.js";

export const DocumentService = {
    async upload(bookingId, payload = {}, actor = {}, options = {}) {
        const [document] = await BookingDocument.create(
            [
                {
                    bookingId,
                    travellerId: payload.travellerId || payload.travelerId || null,
                    type: payload.type || DOCUMENT_TYPE.OTHER,
                    fileName: payload.fileName || payload.name || "",
                    url: payload.url || "",
                    mimeType: payload.mimeType || "",
                    size: Number(payload.size || 0),
                    quoteAmount: payload.quoteAmount == null ? null : Number(payload.quoteAmount),
                    quoteVersion:
                        payload.quoteVersion == null ? null : Number(payload.quoteVersion),
                    currency: payload.currency || "",
                    status: payload.status || DOCUMENT_STATUS.UPLOADED,
                    storageProvider: payload.storageProvider || "LOCAL",
                    storageKey: payload.storageKey || "",
                    uploadedBy: actor.id || null,
                    uploadedAt: new Date(),
                },
            ],
            options,
        );
        return document;
    },

    async uploadQuoteToR2({
        bookingId,
        agencyId,
        version,
        buffer,
        fileName,
        quoteAmount,
        currency,
        actor,
    }) {
        const key = generateQuoteDocumentKey({ agencyId, bookingId, version });
        const result = await DocumentStorageService.upload({
            key,
            body: buffer,
            contentType: "application/pdf",
            metadata: {
                bookingId: String(bookingId),
                version: String(version),
                quoteAmount: String(quoteAmount),
            },
        });

        const [document] = await BookingDocument.create([
            {
                bookingId,
                type: DOCUMENT_TYPE.QUOTE,
                fileName: fileName || `quote-v${version}.pdf`,
                url: "",
                mimeType: "application/pdf",
                size: result.size || buffer.length,
                quoteAmount: Number(quoteAmount),
                quoteVersion: Number(version),
                currency: currency || "INR",
                status: DOCUMENT_STATUS.UPLOADED,
                storageProvider: "R2",
                storageKey: result.key,
                uploadedBy: actor.id || null,
                uploadedAt: new Date(),
            },
        ]);

        return document;
    },

    async uploadGeneratedQuote(payload) {
        if (DocumentStorageService.isConfigured()) {
            try {
                return await this.uploadQuoteToR2(payload);
            } catch (error) {
                if (process.env.NODE_ENV === "production")
                    throw Object.assign(
                        new Error("Quote document storage is unavailable. Verify the R2 credentials and bucket permissions."),
                        { status: 503, cause: error },
                    );
                console.warn(
                    `[quote-storage] R2 upload failed (${error?.name || "storage error"}); using private local development storage.`,
                );
            }
        }
        await fs.mkdir(privateQuoteUploadDirectory, { recursive: true });
        const safeName = `quote-${String(payload.bookingId)}-v${Number(payload.version) || 1}.pdf`;
        await fs.writeFile(path.join(privateQuoteUploadDirectory, safeName), payload.buffer);
        const [document] = await BookingDocument.create([
            {
                bookingId: payload.bookingId,
                type: DOCUMENT_TYPE.QUOTE,
                fileName: payload.fileName || safeName,
                url: safeName,
                mimeType: "application/pdf",
                size: payload.buffer.length,
                quoteAmount: Number(payload.quoteAmount),
                quoteVersion: Number(payload.version),
                currency: payload.currency || "INR",
                status: DOCUMENT_STATUS.UPLOADED,
                storageProvider: "LOCAL_PRIVATE",
                uploadedBy: payload.actor?.id || null,
                uploadedAt: new Date(),
            },
        ]);
        return document;
    },

    list(bookingId) {
        return BookingDocument.find({ bookingId }).sort({ uploadedAt: -1 });
    },

    latest(bookingId, type) {
        return BookingDocument.findOne({ bookingId, ...(type ? { type } : {}) }).sort({
            uploadedAt: -1,
        });
    },
};

export default DocumentService;
