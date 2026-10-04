export default class DevelopmentOtpProvider {
    available = true;

    constructor({ testOtp }) {
        this.testOtp = testOtp;
    }

    async sendOtp() {
        return { provider: "development", accepted: true };
    }
}
