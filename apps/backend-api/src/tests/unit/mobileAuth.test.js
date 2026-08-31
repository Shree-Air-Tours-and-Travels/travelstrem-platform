import { jest } from "@jest/globals";

let storedChallenge;
const challengeModel = {
    findOne: jest.fn(() => ({ sort: jest.fn().mockResolvedValue(null) })),
    countDocuments: jest.fn().mockResolvedValue(0),
    updateMany: jest.fn().mockResolvedValue({ acknowledged: true }),
    create: jest.fn(async (payload) => {
        storedChallenge = {
            ...payload,
            _id: { toString: () => "507f1f77bcf86cd799439011" },
            attemptCount: 0,
            verifiedAt: null,
            invalidatedAt: null,
            save: jest.fn().mockResolvedValue(undefined),
        };
        return storedChallenge;
    }),
    findById: jest.fn(async () => storedChallenge),
};
const sendOtp = jest.fn().mockResolvedValue({ accepted: true });
const authenticateWithMobile = jest.fn().mockResolvedValue({ _id: "user-1" });

class AuthServiceError extends Error {
    constructor(code, message, status) {
        super(message);
        this.code = code;
        this.status = status;
    }
}

jest.unstable_mockModule("../../config/index.js", () => ({
    default: {
        MOBILE_AUTH_ENABLED: true,
        MOBILE_AUTH_DEV_MODE: true,
        MOBILE_AUTH_TEST_OTP: "123456",
        MOBILE_OTP_EXPIRY_SECONDS: 300,
        MOBILE_OTP_MAX_ATTEMPTS: 5,
        MOBILE_OTP_RESEND_COOLDOWN_SECONDS: 60,
        IS_DEVELOPMENT: true,
    },
}));
jest.unstable_mockModule("../../modules/auth/models/MobileOtpChallenge.js", () => ({
    default: challengeModel,
}));
jest.unstable_mockModule("../../modules/auth/providers/mobile/index.js", () => ({
    mobileOtpProvider: { sendOtp },
}));
jest.unstable_mockModule("../../modules/auth/services/identity.service.js", () => ({
    AuthServiceError,
    authenticateWithMobile,
}));

const { normalizeMobileNumber, requestMobileOtp, verifyMobileOtp } =
    await import("../../modules/auth/services/mobileAuth.service.js");

beforeEach(() => {
    jest.clearAllMocks();
    challengeModel.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(null) });
    challengeModel.countDocuments.mockResolvedValue(0);
    sendOtp.mockResolvedValue({ accepted: true });
    storedChallenge = undefined;
});

test("invalid mobile number is rejected", () => {
    expect(() => normalizeMobileNumber("1234")).toThrow(/valid mobile number/);
});

test("Indian mobile number is normalized to E.164 and challenge is hashed", async () => {
    const result = await requestMobileOtp({ phoneNumber: "98765 43210", portal: "customer" });
    expect(result.phoneNumber).toBe("+919876543210");
    expect(sendOtp).toHaveBeenCalledWith("+919876543210", "123456");
    expect(storedChallenge.otpHash).not.toContain("123456");
});

test("an unavailable OTP provider creates neither a challenge nor an authenticated user", async () => {
    sendOtp.mockRejectedValue(
        new AuthServiceError(
            "MOBILE_OTP_PROVIDER_NOT_CONFIGURED",
            "Mobile verification is currently unavailable.",
            503,
        ),
    );

    await expect(
        requestMobileOtp({ phoneNumber: "+919876543210", portal: "customer" }),
    ).rejects.toMatchObject({
        code: "MOBILE_OTP_PROVIDER_NOT_CONFIGURED",
        message: "Mobile verification is currently unavailable.",
        status: 503,
    });
    expect(challengeModel.create).not.toHaveBeenCalled();
    expect(authenticateWithMobile).not.toHaveBeenCalled();
});

test("verified OTP authenticates and cannot be reused", async () => {
    await requestMobileOtp({ phoneNumber: "+919876543210", portal: "customer" });
    await expect(
        verifyMobileOtp({
            challengeId: "507f1f77bcf86cd799439011",
            otp: "123456",
            portal: "customer",
        }),
    ).resolves.toMatchObject({ user: { _id: "user-1" } });
    expect(storedChallenge.verifiedAt).toBeInstanceOf(Date);
    await expect(
        verifyMobileOtp({
            challengeId: "507f1f77bcf86cd799439011",
            otp: "123456",
            portal: "customer",
        }),
    ).rejects.toMatchObject({ code: "INVALID_OTP" });
});

test("expired and incorrect OTPs are rejected and attempts are counted", async () => {
    await requestMobileOtp({ phoneNumber: "+919876543210", portal: "customer" });
    await expect(
        verifyMobileOtp({
            challengeId: "507f1f77bcf86cd799439011",
            otp: "999999",
            portal: "customer",
        }),
    ).rejects.toMatchObject({ code: "INVALID_OTP" });
    expect(storedChallenge.attemptCount).toBe(1);
    storedChallenge.expiresAt = new Date(Date.now() - 1);
    await expect(
        verifyMobileOtp({
            challengeId: "507f1f77bcf86cd799439011",
            otp: "123456",
            portal: "customer",
        }),
    ).rejects.toMatchObject({ code: "INVALID_OTP" });
});

test("excessive OTP attempts are blocked", async () => {
    await requestMobileOtp({ phoneNumber: "+919876543210", portal: "customer" });
    storedChallenge.attemptCount = storedChallenge.maxAttempts;
    await expect(
        verifyMobileOtp({
            challengeId: "507f1f77bcf86cd799439011",
            otp: "123456",
            portal: "customer",
        }),
    ).rejects.toMatchObject({ code: "OTP_ATTEMPTS_EXCEEDED" });
});
