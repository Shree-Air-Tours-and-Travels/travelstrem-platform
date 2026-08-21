import { jest } from "@jest/globals";

jest.unstable_mockModule("@aws-sdk/client-s3", () => {
  const mockSend = jest.fn().mockResolvedValue({ ETag: '"abc123"' });
  return {
    S3Client: jest.fn(() => ({ send: mockSend })),
    PutObjectCommand: jest.fn((input) => input),
    GetObjectCommand: jest.fn((input) => input),
    DeleteObjectCommand: jest.fn((input) => input),
    HeadObjectCommand: jest.fn((input) => input),
    __mockSend: mockSend,
  };
});

jest.unstable_mockModule("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(() => "https://r2.example.com/signed-url?token=abc"),
}));

const { generateQuoteDocumentKey, sanitizePathSegment } = await import("../../services/r2/objectKey.js");
const DocumentStorageServiceModule = await import("../../services/r2/DocumentStorageService.js");
const r2ClientModule = await import("../../services/r2/r2Client.js");
const configModule = await import("../../services/r2/config.js");

const DocumentStorageService = DocumentStorageServiceModule.default;
const r2Client = r2ClientModule;

beforeEach(() => {
  delete process.env.R2_ACCOUNT_ID;
  delete process.env.R2_ACCESS_KEY_ID;
  delete process.env.R2_SECRET_ACCESS_KEY;
  delete process.env.R2_BUCKET_NAME;
  delete process.env.R2_ENDPOINT;
  delete process.env.R2_SIGNED_URL_EXPIRY_SECONDS;
  r2Client.resetR2Client();
});

describe("objectKey helpers", () => {
  describe("sanitizePathSegment", () => {
    test("strips unsafe characters", () => {
      expect(sanitizePathSegment("agency/../../etc")).toBe("agency-etc");
    });

    test("handles empty input", () => {
      expect(sanitizePathSegment("")).toBe("unknown");
      expect(sanitizePathSegment(null)).toBe("unknown");
    });

    test("preserves safe characters", () => {
      expect(sanitizePathSegment("ag_123-v2")).toBe("ag_123-v2");
    });

    test("truncates long segments", () => {
      const long = "a".repeat(200);
      expect(sanitizePathSegment(long).length).toBe(128);
    });
  });

  describe("generateQuoteDocumentKey", () => {
    test("generates correct key with all fields", () => {
      const key = generateQuoteDocumentKey({ agencyId: "ag_123", bookingId: "bk_456", version: 2 });
      expect(key).toBe("quotes/ag_123/bk_456/quote-v2.pdf");
    });

    test("uses no-agency when agencyId is missing", () => {
      const key = generateQuoteDocumentKey({ bookingId: "bk_456", version: 1 });
      expect(key).toBe("quotes/no-agency/bk_456/quote-v1.pdf");
    });

    test("defaults version to 1", () => {
      const key = generateQuoteDocumentKey({ agencyId: "ag", bookingId: "bk" });
      expect(key).toBe("quotes/ag/bk/quote-v1.pdf");
    });

    test("prevents path traversal in agencyId", () => {
      const key = generateQuoteDocumentKey({ agencyId: "../admin", bookingId: "bk", version: 1 });
      expect(key).not.toContain("..");
      expect(key).toMatch(/^quotes\//);
    });

    test("prevents path traversal in bookingId", () => {
      const key = generateQuoteDocumentKey({ agencyId: "ag", bookingId: "../../etc/passwd", version: 1 });
      expect(key).not.toContain("..");
      expect(key).toMatch(/^quotes\/ag\//);
    });
  });
});

describe("R2 config", () => {
  test("isConfigured returns false when env vars are missing", () => {
    expect(configModule.isR2Configured()).toBe(false);
  });

  test("isConfigured returns true when all env vars are set", () => {
    process.env.R2_ACCOUNT_ID = "acct";
    process.env.R2_ACCESS_KEY_ID = "key";
    process.env.R2_SECRET_ACCESS_KEY = "secret";
    process.env.R2_BUCKET_NAME = "bucket";
    process.env.R2_ENDPOINT = "https://endpoint.r2.cloudflarestorage.com";
    expect(configModule.isR2Configured()).toBe(true);
  });

  test("getR2Config returns null when not configured", () => {
    expect(configModule.getR2Config()).toBeNull();
  });

  test("getR2Config returns config object when configured", () => {
    process.env.R2_ACCOUNT_ID = "acct";
    process.env.R2_ACCESS_KEY_ID = "key";
    process.env.R2_SECRET_ACCESS_KEY = "secret";
    process.env.R2_BUCKET_NAME = "bucket";
    process.env.R2_ENDPOINT = "https://endpoint.r2.cloudflarestorage.com";
    const cfg = configModule.getR2Config();
    expect(cfg).not.toBeNull();
    expect(cfg.bucketName).toBe("bucket");
    expect(cfg.accountId).toBe("acct");
  });

  test("getSignedUrlDefaultExpiry defaults to 600", () => {
    expect(configModule.getSignedUrlDefaultExpiry()).toBe(600);
  });

  test("getSignedUrlDefaultExpiry respects env override", () => {
    process.env.R2_SIGNED_URL_EXPIRY_SECONDS = "120";
    expect(configModule.getSignedUrlDefaultExpiry()).toBe(120);
  });

  test("getSignedUrlDefaultExpiry clamps to max 3600", () => {
    process.env.R2_SIGNED_URL_EXPIRY_SECONDS = "9999";
    expect(configModule.getSignedUrlDefaultExpiry()).toBe(3600);
  });

  test("getSignedUrlDefaultExpiry clamps to min 60", () => {
    process.env.R2_SIGNED_URL_EXPIRY_SECONDS = "10";
    expect(configModule.getSignedUrlDefaultExpiry()).toBe(60);
  });
});

describe("DocumentStorageService (configured)", () => {
  beforeEach(() => {
    process.env.R2_ACCOUNT_ID = "test-account";
    process.env.R2_ACCESS_KEY_ID = "test-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret";
    process.env.R2_BUCKET_NAME = "test-bucket";
    process.env.R2_ENDPOINT = "https://test-account.r2.cloudflarestorage.com";
    r2Client.resetR2Client();
  });

  test("isConfigured returns true", () => {
    expect(DocumentStorageService.isConfigured()).toBe(true);
  });

  test("upload returns key and bucket", async () => {
    const result = await DocumentStorageService.upload({
      key: "quotes/test/test/test.pdf",
      body: Buffer.from("test content"),
      contentType: "application/pdf",
    });
    expect(result.key).toBe("quotes/test/test/test.pdf");
    expect(result.bucket).toBe("test-bucket");
    expect(result.contentType).toBe("application/pdf");
  });

  test("getSignedDownloadUrl returns url and expiresIn", async () => {
    const result = await DocumentStorageService.getSignedDownloadUrl("quotes/test.pdf");
    expect(result.url).toContain("https://");
    expect(result.expiresIn).toBe(600);
  });

  test("getSignedUploadUrl returns url and key", async () => {
    const result = await DocumentStorageService.getSignedUploadUrl("quotes/test.pdf", "application/pdf");
    expect(result.url).toContain("https://");
    expect(result.key).toBe("quotes/test.pdf");
  });

  test("delete resolves without error", async () => {
    await expect(DocumentStorageService.delete("quotes/test.pdf")).resolves.not.toThrow();
  });

  test("download returns buffer from S3", async () => {
    const { Readable } = await import("stream");
    const { __mockSend } = await import("@aws-sdk/client-s3");
    __mockSend.mockReset();
    __mockSend.mockResolvedValueOnce({ Body: Readable.from([Buffer.from("pdf-bytes")]) });
    const result = await DocumentStorageService.download("quotes/test.pdf");
    expect(result.toString()).toBe("pdf-bytes");
  });

  test("exists returns true for found objects", async () => {
    const { __mockSend } = await import("@aws-sdk/client-s3");
    __mockSend.mockReset();
    __mockSend.mockResolvedValueOnce({});
    const result = await DocumentStorageService.exists("quotes/test.pdf");
    expect(result).toBe(true);
  });

  test("exists returns false for 404", async () => {
    const { __mockSend } = await import("@aws-sdk/client-s3");
    __mockSend.mockReset();
    __mockSend.mockRejectedValueOnce({ name: "NotFound", $metadata: { httpStatusCode: 404 } });
    const result = await DocumentStorageService.exists("quotes/missing.pdf");
    expect(result).toBe(false);
  });
});

describe("DocumentStorageService (unconfigured)", () => {
  beforeEach(() => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET_NAME;
    delete process.env.R2_ENDPOINT;
    r2Client.resetR2Client();
  });

  test("isConfigured returns false", () => {
    expect(DocumentStorageService.isConfigured()).toBe(false);
  });

  test("upload throws when not configured", async () => {
    await expect(DocumentStorageService.upload({ key: "test", body: Buffer.from("x") }))
      .rejects.toThrow("R2 storage is not configured");
  });

  test("download throws when not configured", async () => {
    await expect(DocumentStorageService.download("test"))
      .rejects.toThrow("R2 storage is not configured");
  });

  test("delete throws when not configured", async () => {
    await expect(DocumentStorageService.delete("test"))
      .rejects.toThrow("R2 storage is not configured");
  });

  test("exists throws when not configured", async () => {
    await expect(DocumentStorageService.exists("test"))
      .rejects.toThrow("R2 storage is not configured");
  });

  test("getSignedDownloadUrl throws when not configured", async () => {
    await expect(DocumentStorageService.getSignedDownloadUrl("test"))
      .rejects.toThrow("R2 storage is not configured");
  });

  test("getSignedUploadUrl throws when not configured", async () => {
    await expect(DocumentStorageService.getSignedUploadUrl("test", "application/pdf"))
      .rejects.toThrow("R2 storage is not configured");
  });
});
