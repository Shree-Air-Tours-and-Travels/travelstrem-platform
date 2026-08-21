import DocumentStorageService from "../../../services/r2/DocumentStorageService.js";
import { generateQuoteDocumentKey } from "../../../services/r2/objectKey.js";
import { isR2Configured } from "../../../services/r2/config.js";

const TEST_PDF_CONTENT = Buffer.from("%PDF-1.4\\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\\n%%EOF\\n");

export async function r2HealthCheck(req, res) {
  try {
    if (!isR2Configured()) return res.json({ status: "success", data: { configured: false, steps: { skipped: true, reason: "R2 is not configured" } } });
    const key = generateQuoteDocumentKey({ agencyId: "test", bookingId: "test-quote", version: 1 });
    const upload = await DocumentStorageService.upload({ key, body: TEST_PDF_CONTENT, contentType: "application/pdf" });
    const exists = await DocumentStorageService.exists(key);
    const signed = await DocumentStorageService.getSignedDownloadUrl(key, 60);
    const downloaded = await DocumentStorageService.download(key);
    await DocumentStorageService.delete(key);
    return res.json({ status: "success", data: { configured: true, steps: { upload: { success: true, size: upload.size }, exists: { success: true, exists }, signedUrl: { success: true, expiresIn: signed.expiresIn }, download: { success: true, size: downloaded.length }, delete: { success: true } } } });
  } catch (err) {
    console.error("r2HealthCheck error:", err);
    return res.status(500).json({ status: "error", message: "R2 health check failed", error: err.message });
  }
}
