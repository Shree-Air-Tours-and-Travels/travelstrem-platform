import crypto from "crypto";
import PaymentProviderInterface from "./payment.provider.interface.js";
import { assertMinor } from "../utils/money.js";

export default class RazorpayProvider extends PaymentProviderInterface {
  constructor({ keyId, keySecret, webhookSecret, apiBaseUrl = "https://api.razorpay.com/v1", timeoutMs = 15000, fetchImpl = globalThis.fetch } = {}) {
    super();
    this.keyId = keyId;
    this.keySecret = keySecret;
    this.webhookSecret = webhookSecret;
    this.apiBaseUrl = String(apiBaseUrl).replace(/\/$/, "");
    this.timeoutMs = Number.isSafeInteger(Number(timeoutMs)) && Number(timeoutMs) > 0 ? Number(timeoutMs) : 15000;
    this.fetch = fetchImpl;
  }
  async request(path, body) {
    if (!this.keyId || !this.keySecret) throw new Error("Razorpay credentials are not configured");
    const response = await this.fetch(`${this.apiBaseUrl}${path}`, { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64")}`, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(this.timeoutMs) });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.description || `Razorpay request failed (${response.status})`);
    return data;
  }
  createPayment({ amountMinor, currency = "INR", reference, metadata = {} }) {
    assertMinor(amountMinor);
    return this.request("/orders", { amount: amountMinor, currency, receipt: reference, notes: metadata });
  }
  verifyWebhook({ rawBody, signature }) {
    if (!this.webhookSecret) throw new Error("Razorpay webhook secret is not configured");
    const expected = crypto.createHmac("sha256", this.webhookSecret).update(rawBody).digest("hex");
    const received = Buffer.from(String(signature || ""), "utf8");
    const calculated = Buffer.from(expected, "utf8");
    return received.length === calculated.length && crypto.timingSafeEqual(received, calculated);
  }
  refund({ paymentId, amountMinor, reference }) {
    assertMinor(amountMinor);
    return this.request(`/payments/${encodeURIComponent(paymentId)}/refund`, { amount: amountMinor, notes: { reference } });
  }
}
