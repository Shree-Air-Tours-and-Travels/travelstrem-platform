import BookingDocument from "../models/BookingDocument.js";
import { DOCUMENT_STATUS, DOCUMENT_TYPE } from "../../../constants/enums.js";
import DocumentStorageService from "../../../services/r2/DocumentStorageService.js";
import { generateQuoteDocumentKey } from "../../../services/r2/objectKey.js";

export const DocumentService = {
  async upload(bookingId, payload = {}, actor = {}, options = {}) {
    const [document] = await BookingDocument.create([{
      bookingId,
      travellerId: payload.travellerId || payload.travelerId || null,
      type: payload.type || DOCUMENT_TYPE.OTHER,
      fileName: payload.fileName || payload.name || "",
      url: payload.url || "",
      mimeType: payload.mimeType || "",
      size: Number(payload.size || 0),
      quoteAmount: payload.quoteAmount == null ? null : Number(payload.quoteAmount),
      quoteVersion: payload.quoteVersion == null ? null : Number(payload.quoteVersion),
      currency: payload.currency || "",
      status: payload.status || DOCUMENT_STATUS.UPLOADED,
      storageProvider: payload.storageProvider || "LOCAL",
      storageKey: payload.storageKey || "",
      uploadedBy: actor.id || null,
      uploadedAt: new Date(),
    }], options);
    return document;
  },

  async uploadQuoteToR2({ bookingId, agencyId, version, buffer, fileName, quoteAmount, currency, actor }) {
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

    const [document] = await BookingDocument.create([{
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
    }]);

    return document;
  },

  list(bookingId) {
    return BookingDocument.find({ bookingId }).sort({ uploadedAt: -1 });
  },

  latest(bookingId, type) {
    return BookingDocument.findOne({ bookingId, ...(type ? { type } : {}) }).sort({ uploadedAt: -1 });
  },
};

export default DocumentService;
