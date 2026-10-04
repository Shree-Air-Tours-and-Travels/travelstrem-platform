import { AuthServiceError } from "../../services/identity.service.js";

export default class UnavailableOtpProvider {
    available = false;

    async sendOtp() {
        throw new AuthServiceError(
            "MOBILE_OTP_PROVIDER_NOT_CONFIGURED",
            "Mobile verification is currently unavailable.",
            503,
        );
    }
}
