export default class PaymentProviderInterface {
    assertConfigured() { throw new Error("assertConfigured must be implemented"); }
    findOrder() { throw new Error("findOrder must be implemented for order recovery"); }
    checkout() { throw new Error("checkout must return public checkout options"); }
    webhookCredentials() { throw new Error("webhookCredentials must be implemented"); }
    verifyCallback() { throw new Error("verifyCallback must be implemented"); }
    createOrder(input) {
        return this.createPayment(input);
    }
    async verifyPayment() {
        throw new Error("verifyPayment must be implemented");
    }
    async parseWebhook() {
        throw new Error("parseWebhook must be implemented");
    }
    async createPayment() {
        throw new Error("createPayment must be implemented by the payment provider");
    }
    async verifyWebhook() {
        throw new Error("verifyWebhook must be implemented by the payment provider");
    }
    async refund() {
        throw new Error("refund must be implemented by the payment provider");
    }
}
