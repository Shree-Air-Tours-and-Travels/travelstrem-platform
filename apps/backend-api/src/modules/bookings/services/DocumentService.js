import BookingDocument from "../models/BookingDocument.js";
import { DOCUMENT_STATUS, DOCUMENT_TYPE } from "../../../constants/enums.js";

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
      status: payload.status || DOCUMENT_STATUS.UPLOADED,
      uploadedBy: actor.id || null,
      uploadedAt: new Date(),
    }], options);
    return document;
  },

  list(bookingId) {
    return BookingDocument.find({ bookingId }).sort({ uploadedAt: -1 });
  },
};

export default DocumentService;
