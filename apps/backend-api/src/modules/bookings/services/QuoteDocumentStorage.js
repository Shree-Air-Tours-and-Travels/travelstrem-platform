import fs from "fs/promises";
import path from "path";
import BookingDocument from "../models/BookingDocument.js";
import { DOCUMENT_TYPE } from "../../../constants/enums.js";
import DocumentStorageService from "../../../services/r2/DocumentStorageService.js";

export const quoteUploadDirectory = path.resolve("uploads", "quotes");
export const privateQuoteUploadDirectory = path.resolve("private-uploads", "quotes");

export async function latestQuoteDocument(bookingId, quoteVersion = null) {
    return BookingDocument.findOne({
        bookingId,
        type: DOCUMENT_TYPE.QUOTE,
        ...(quoteVersion == null ? {} : { quoteVersion: Number(quoteVersion) }),
    }).sort({ quoteVersion: -1, uploadedAt: -1 });
}

export function resolveQuoteDocumentPath(document) {
    if (!document?.url) return null;
    const fileName = path.basename(String(document.url));
    const directory =
        document.storageProvider === "LOCAL_PRIVATE"
            ? privateQuoteUploadDirectory
            : quoteUploadDirectory;
    const resolved = path.resolve(directory, fileName);
    if (!resolved.startsWith(`${directory}${path.sep}`)) return null;
    return resolved;
}

export async function readQuoteDocument(document) {
    if (document?.storageProvider === "R2" && document?.storageKey) {
        if (!DocumentStorageService.isConfigured()) return null;
        try {
            return await DocumentStorageService.download(document.storageKey);
        } catch {
            return null;
        }
    }

    const filePath = resolveQuoteDocumentPath(document);
    if (!filePath) return null;
    try {
        return await fs.readFile(filePath);
    } catch (error) {
        if (error?.code === "ENOENT") return null;
        throw error;
    }
}

export async function getQuoteDocumentSignedUrl(document, expiresIn) {
    if (document?.storageProvider === "R2" && document?.storageKey) {
        if (!DocumentStorageService.isConfigured()) return null;
        return DocumentStorageService.getSignedDownloadUrl(document.storageKey, expiresIn);
    }

    if (document?.url) {
        return { url: document.url, expiresIn: null };
    }
    return null;
}

export default {
    latestQuoteDocument,
    readQuoteDocument,
    getQuoteDocumentSignedUrl,
    resolveQuoteDocumentPath,
    quoteUploadDirectory,
};
