import crypto from "crypto";
import { CodeChallengeMethod, OAuth2Client } from "google-auth-library";
import config from "../../../config/index.js";
import { normalizePortalScope } from "../../../core/auth/portalSession.js";
import OAuthTransaction from "../models/OAuthTransaction.js";
import { AuthServiceError, authenticateWithGoogle } from "./identity.service.js";
import { safeReturnUrl } from "./returnUrl.service.js";

const stateHash = (state) => crypto.createHash("sha256").update(String(state)).digest("hex");
const googleClient = () =>
    new OAuth2Client({
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        redirectUri: config.GOOGLE_CALLBACK_URL,
    });

const assertConfigured = () => {
    if (!config.GOOGLE_AUTH_ENABLED || !config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
        throw new AuthServiceError(
            "GOOGLE_AUTH_NOT_CONFIGURED",
            "Google authentication is currently unavailable.",
            503,
        );
    }
};

export const beginGoogleAuthentication = async ({
    portal: rawPortal,
    returnTo,
    ipAddress = "",
    userAgent = "",
}) => {
    assertConfigured();
    const portal = normalizePortalScope(rawPortal);
    const client = googleClient();
    const state = crypto.randomBytes(32).toString("base64url");
    const nonce = crypto.randomBytes(32).toString("base64url");
    const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();

    await OAuthTransaction.create({
        stateHash: stateHash(state),
        provider: "GOOGLE",
        portal,
        returnTo: safeReturnUrl(returnTo, portal),
        nonce,
        codeVerifier,
        expiresAt: new Date(Date.now() + config.OAUTH_TRANSACTION_TTL_SECONDS * 1000),
        ipAddress: String(ipAddress).slice(0, 100),
        userAgent: String(userAgent).slice(0, 500),
    });

    return client.generateAuthUrl({
        access_type: "online",
        scope: ["openid", "email", "profile"],
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: CodeChallengeMethod.S256,
        include_granted_scopes: true,
        prompt: "select_account",
    });
};

export const completeGoogleAuthentication = async ({ state, code }) => {
    assertConfigured();
    if (!state || !code)
        throw new AuthServiceError(
            "GOOGLE_AUTH_FAILED",
            "Unable to authenticate with Google.",
            400,
        );

    const transaction = await OAuthTransaction.findOneAndUpdate(
        { stateHash: stateHash(state), consumedAt: null, expiresAt: { $gt: new Date() } },
        { $set: { consumedAt: new Date() } },
        { new: true },
    );
    if (!transaction)
        throw new AuthServiceError(
            "OAUTH_STATE_INVALID",
            "The Google login request is invalid or expired.",
            400,
        );

    const client = googleClient();
    const { tokens } = await client.getToken({
        code,
        codeVerifier: transaction.codeVerifier,
        redirect_uri: config.GOOGLE_CALLBACK_URL,
    });
    if (!tokens.id_token)
        throw new AuthServiceError(
            "GOOGLE_AUTH_FAILED",
            "Google did not return a valid identity token.",
            401,
        );

    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: config.GOOGLE_CLIENT_ID,
    });
    const claims = ticket.getPayload();
    if (
        !claims ||
        claims.nonce !== transaction.nonce ||
        !["accounts.google.com", "https://accounts.google.com"].includes(claims.iss)
    ) {
        throw new AuthServiceError(
            "GOOGLE_ID_TOKEN_INVALID",
            "Google identity validation failed.",
            401,
        );
    }

    const user = await authenticateWithGoogle({ claims, portal: transaction.portal });
    return { user, portal: transaction.portal, returnTo: transaction.returnTo };
};
