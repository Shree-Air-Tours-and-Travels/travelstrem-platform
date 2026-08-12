import { validateGoogleConfiguration, validateMobileDevelopmentMode } from "../../modules/auth/services/authConfigValidation.js";

test("Google authentication fails startup validation when enabled credentials are incomplete", () => {
  expect(() => validateGoogleConfiguration({ enabled: true, clientId: "", clientSecret: "", callbackUrl: "http://localhost/callback" }))
    .toThrow(/GOOGLE_CLIENT_ID/);
});

test("disabled Google authentication can start without credentials", () => {
  expect(() => validateGoogleConfiguration({ enabled: false })).not.toThrow();
});

test("production rejects the development mobile OTP provider", () => {
  expect(() => validateMobileDevelopmentMode({ isProduction: true, devMode: true, testOtp: "123456" }))
    .toThrow(/cannot be enabled in production/);
});

test("development test OTP must be six digits", () => {
  expect(() => validateMobileDevelopmentMode({ isProduction: false, devMode: true, testOtp: "123" }))
    .toThrow(/exactly 6 digits/);
});
