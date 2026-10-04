import RazorpayProvider from "./razorpay.provider.js";
import { resolveTenantIntegration } from "../../../modules/integrations/runtime.js";

export const getConfiguredPaymentProviderName = () => resolveTenantIntegration("payments").provider;

export function getPaymentProvider(name) {
    const runtime = resolveTenantIntegration("payments");
    name ||= runtime.provider;
    if (name !== runtime.provider) throw Object.assign(new Error("Payment provider does not match this tenant configuration."), { status: 403 });
    if (name !== "razorpay") throw new Error(`Unsupported payment provider: ${name}`);
    return new RazorpayProvider({
        keyId: runtime.credentials.keyId,
        keySecret: runtime.credentials.keySecret,
        webhookSecret: runtime.credentials.webhookSecret,
        // Local test checkout can open before webhook setup; confirmation still requires a verified webhook.
        requireWebhook: !(
            process.env.NODE_ENV === "development" &&
            process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_")
        ),
        apiBaseUrl: runtime.options.apiBaseUrl,
        timeoutMs: Number(runtime.options.timeoutMs || 15000),
    });
}
