import crypto from "crypto";
import PaymentProviderInterface from "./payment.provider.interface.js";
import { assertMinor } from "../utils/money.js";

export default class RazorpayProvider extends PaymentProviderInterface {
    constructor({
        keyId,
        keySecret,
        webhookSecret,
        requireWebhook = true,
        apiBaseUrl = "https://api.razorpay.com/v1",
        timeoutMs = 15000,
        fetchImpl = globalThis.fetch,
    } = {}) {
        super();
        this.keyId = keyId?.trim();
        this.keySecret = keySecret?.trim();
        this.webhookSecret = webhookSecret;
        this.requireWebhook = requireWebhook;
        this.apiBaseUrl = String(apiBaseUrl).replace(/\/$/, "");
        this.timeoutMs =
            Number.isSafeInteger(Number(timeoutMs)) && Number(timeoutMs) > 0
                ? Number(timeoutMs)
                : 15000;
        this.fetch = fetchImpl;
    }
    async request(path, body, method = "POST") {
        if (!this.keyId || !this.keySecret)
            throw new Error("Razorpay credentials are not configured");
        const response = await this.fetch(`${this.apiBaseUrl}${path}`, {
            method,
            headers: {
                Authorization: `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64")}`,
                "Content-Type": "application/json",
            },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
            signal: AbortSignal.timeout(this.timeoutMs),
        });
        const data = await response.json();
        if (!response.ok && (response.status === 401 || data?.error?.description === "Authentication failed")) {
            throw Object.assign(new Error("Razorpay rejected the backend API credentials. Check the matching Key ID and Key Secret, then restart the backend."), {
                status: 503,
                code: "PAYMENT_PROVIDER_AUTH_FAILED",
            });
        }
        if (!response.ok)
            throw new Error(
                data?.error?.description || `Razorpay request failed (${response.status})`,
            );
        return data;
    }
    assertConfigured() {
        if (!this.keyId || !this.keySecret) {
            throw Object.assign(new Error("Razorpay checkout is unavailable: backend payment credentials are not configured."), { status: 503 });
        }
        if (this.requireWebhook && !this.webhookSecret) {
            throw Object.assign(new Error("Razorpay checkout is unavailable: the backend webhook secret is not configured."), { status: 503 });
        }
    }
    async findOrder(reference) {
        const result = await this.request(`/orders?receipt=${encodeURIComponent(reference)}&count=100`, undefined, "GET");
        const orders = (result.items || []).filter(order => order.receipt === reference);
        if (orders.length > 1) throw new Error("Multiple gateway orders require reconciliation");
        return orders[0] || null;
    }
    createPayment({ amountMinor, currency = "INR", reference, metadata = {} }) {
        assertMinor(amountMinor);
        return this.request("/orders", {
            amount: amountMinor,
            currency,
            receipt: reference,
            notes: metadata,
        });
    }
    verifyWebhook({ rawBody, signature }) {
        if (!this.webhookSecret) throw new Error("Razorpay webhook secret is not configured");
        const expected = crypto
            .createHmac("sha256", this.webhookSecret)
            .update(rawBody)
            .digest("hex");
        const received = Buffer.from(String(signature || ""), "utf8");
        const calculated = Buffer.from(expected, "utf8");
        return (
            received.length === calculated.length && crypto.timingSafeEqual(received, calculated)
        );
    }
    webhookCredentials(headers) {
        return { signature: headers["x-razorpay-signature"], eventId: headers["x-razorpay-event-id"] };
    }
    verifyCallback(orderId, input) {
        return input?.razorpay_order_id === orderId && this.verifyPayment({ orderId, paymentId: input.razorpay_payment_id, signature: input.razorpay_signature });
    }
    verifyPayment({ orderId, paymentId, signature }) {
        if (!this.keySecret) return false;
        const expected = crypto
            .createHmac("sha256", this.keySecret)
            .update(`${orderId}|${paymentId}`)
            .digest("hex");
        const actual = Buffer.from(String(signature || ""));
        return (
            actual.length === expected.length &&
            crypto.timingSafeEqual(actual, Buffer.from(expected))
        );
    }
    checkout(order) {
        return {
            provider: "razorpay",
            key: this.keyId,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        };
    }
    parseWebhook(body) {
        const payment = body.payload?.payment?.entity;
        const refund = body.payload?.refund?.entity;
        return { type: body.event, payment, refund };
    }
    refund({ paymentId, amountMinor, reference }) {
        assertMinor(amountMinor);
        return this.request(`/payments/${encodeURIComponent(paymentId)}/refund`, {
            amount: amountMinor,
            notes: { reference },
        });
    }
}
