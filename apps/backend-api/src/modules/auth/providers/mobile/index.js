import config from "../../../../config/index.js";
import DevelopmentOtpProvider from "./DevelopmentOtpProvider.js";
import UnavailableOtpProvider from "./UnavailableOtpProvider.js";

export const createMobileOtpProvider = () => {
    if (config.IS_DEVELOPMENT && config.MOBILE_AUTH_DEV_MODE) {
        return new DevelopmentOtpProvider({ testOtp: config.MOBILE_AUTH_TEST_OTP });
    }
    if (config.MOBILE_AUTH_PROVIDER) {
        throw new Error(
            `Unsupported MOBILE_AUTH_PROVIDER "${config.MOBILE_AUTH_PROVIDER}". Add its adapter in modules/auth/providers/mobile/index.js.`,
        );
    }
    return new UnavailableOtpProvider();
};

export const mobileOtpProvider = createMobileOtpProvider();
