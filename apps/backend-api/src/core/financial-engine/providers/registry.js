import RazorpayProvider from "./razorpay.provider.js";
export function getPaymentProvider(name = process.env.PAYMENT_PROVIDER || "razorpay") {
    if (name !== "razorpay") throw new Error(`Unsupported payment provider: ${name}`);
    return new RazorpayProvider({
        keyId: process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_KEY_SECRET,
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
        // Local test checkout can open before webhook setup; confirmation still requires a verified webhook.
        requireWebhook: !(process.env.NODE_ENV === "development" && process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_")),
        apiBaseUrl: process.env.RAZORPAY_API_BASE_URL,
        timeoutMs: Number(process.env.RAZORPAY_TIMEOUT_MS || 15000),
    });
}
