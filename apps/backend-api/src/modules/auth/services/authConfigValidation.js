export const validateMobileDevelopmentMode = ({ isProduction, devMode, testOtp }) => {
    if (isProduction && devMode)
        throw new Error("MOBILE_AUTH_DEV_MODE cannot be enabled in production.");
    if (devMode && !/^\d{6}$/.test(String(testOtp || ""))) {
        throw new Error(
            "MOBILE_AUTH_TEST_OTP must contain exactly 6 digits when MOBILE_AUTH_DEV_MODE is enabled.",
        );
    }
};

export const validateGoogleConfiguration = ({ enabled, clientId, clientSecret, callbackUrl }) => {
    if (enabled && (!clientId || !clientSecret || !callbackUrl)) {
        throw new Error(
            "Google authentication is enabled but GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_CALLBACK_URL is missing.",
        );
    }
};
