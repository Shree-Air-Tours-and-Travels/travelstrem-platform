import { jest } from "@jest/globals";

const transactionModel = { create: jest.fn(), findOneAndUpdate: jest.fn() };
const authenticateWithGoogle = jest.fn();
const generateAuthUrl = jest.fn(() => "https://accounts.google.com/o/oauth2/v2/auth?state=test");
const getToken = jest.fn();
const verifyIdToken = jest.fn();
const generateCodeVerifierAsync = jest.fn(async () => ({
    codeVerifier: "verifier",
    codeChallenge: "challenge",
}));
class OAuth2Client {
    generateAuthUrl = generateAuthUrl;
    getToken = getToken;
    verifyIdToken = verifyIdToken;
    generateCodeVerifierAsync = generateCodeVerifierAsync;
}

jest.unstable_mockModule("google-auth-library", () => ({
    OAuth2Client,
    CodeChallengeMethod: { S256: "S256" },
}));
jest.unstable_mockModule("../../config/index.js", () => ({
    default: {
        GOOGLE_AUTH_ENABLED: true,
        GOOGLE_CLIENT_ID: "client-id",
        GOOGLE_CLIENT_SECRET: "client-secret",
        GOOGLE_CALLBACK_URL: "http://localhost:5000/api/auth/google/callback",
        OAUTH_TRANSACTION_TTL_SECONDS: 600,
        FRONTENDS: ["http://localhost:3006"],
        SHELL_URL: "http://localhost:3006",
        ADMIN_URL: "http://localhost:3002",
        PARTNER_URL: "http://localhost:3004",
        AUTH_APP_URL: "http://localhost:3003",
    },
}));
jest.unstable_mockModule("../../modules/auth/models/OAuthTransaction.js", () => ({
    default: transactionModel,
}));
jest.unstable_mockModule("../../modules/auth/services/identity.service.js", () => ({
    AuthServiceError: class AuthServiceError extends Error {
        constructor(code, message, status) {
            super(message);
            this.code = code;
            this.status = status;
        }
    },
    authenticateWithGoogle,
}));

const { beginGoogleAuthentication, completeGoogleAuthentication } =
    await import("../../modules/auth/services/googleAuth.service.js");

beforeEach(() => jest.clearAllMocks());

test("Google authorization creates state, nonce, and PKCE transaction", async () => {
    transactionModel.create.mockResolvedValue({});
    await expect(
        beginGoogleAuthentication({
            portal: "customer",
            returnTo: "http://localhost:3006/favorites",
        }),
    ).resolves.toContain("accounts.google.com");
    expect(transactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
            provider: "GOOGLE",
            codeVerifier: "verifier",
            returnTo: "http://localhost:3006/favorites",
        }),
    );
    expect(generateAuthUrl).toHaveBeenCalledWith(
        expect.objectContaining({
            code_challenge: "challenge",
            code_challenge_method: "S256",
            scope: ["openid", "email", "profile"],
        }),
    );
});

test("post-login redirects cannot point back to AuthTREM or across portals", async () => {
    transactionModel.create.mockResolvedValue({});
    await beginGoogleAuthentication({
        portal: "customer",
        returnTo: "http://localhost:3003/login",
    });
    expect(transactionModel.create).toHaveBeenLastCalledWith(
        expect.objectContaining({ returnTo: "http://localhost:3006" }),
    );

    await beginGoogleAuthentication({ portal: "admin", returnTo: "http://localhost:3006/" });
    expect(transactionModel.create).toHaveBeenLastCalledWith(
        expect.objectContaining({ returnTo: "http://localhost:3002" }),
    );
});

test("OAuth callback rejects a state mismatch", async () => {
    transactionModel.findOneAndUpdate.mockResolvedValue(null);
    await expect(
        completeGoogleAuthentication({ state: "wrong", code: "code" }),
    ).rejects.toMatchObject({ code: "OAUTH_STATE_INVALID" });
    expect(getToken).not.toHaveBeenCalled();
});

test("valid callback verifies nonce and authenticates the internal user", async () => {
    transactionModel.findOneAndUpdate.mockResolvedValue({
        codeVerifier: "verifier",
        nonce: "nonce",
        portal: "customer",
        returnTo: "http://localhost:3006/",
    });
    getToken.mockResolvedValue({ tokens: { id_token: "signed-id-token" } });
    verifyIdToken.mockResolvedValue({
        getPayload: () => ({
            sub: "google-sub",
            email: "user@example.com",
            email_verified: true,
            nonce: "nonce",
            iss: "https://accounts.google.com",
        }),
    });
    authenticateWithGoogle.mockResolvedValue({ _id: "user-1" });

    await expect(
        completeGoogleAuthentication({ state: "state", code: "code" }),
    ).resolves.toMatchObject({ portal: "customer", returnTo: "http://localhost:3006/" });
    expect(getToken).toHaveBeenCalledWith(expect.objectContaining({ codeVerifier: "verifier" }));
    expect(authenticateWithGoogle).toHaveBeenCalledWith(
        expect.objectContaining({ portal: "customer" }),
    );
});

test("callback rejects an invalid nonce", async () => {
    transactionModel.findOneAndUpdate.mockResolvedValue({
        codeVerifier: "verifier",
        nonce: "expected",
        portal: "customer",
        returnTo: "http://localhost:3006/",
    });
    getToken.mockResolvedValue({ tokens: { id_token: "signed-id-token" } });
    verifyIdToken.mockResolvedValue({
        getPayload: () => ({ nonce: "different", iss: "https://accounts.google.com" }),
    });
    await expect(
        completeGoogleAuthentication({ state: "state", code: "code" }),
    ).rejects.toMatchObject({ code: "GOOGLE_ID_TOKEN_INVALID" });
});
