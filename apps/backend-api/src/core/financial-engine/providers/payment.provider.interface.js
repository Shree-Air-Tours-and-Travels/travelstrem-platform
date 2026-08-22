export default class PaymentProviderInterface {
  async createPayment() { throw new Error("createPayment must be implemented by the payment provider"); }
  async verifyWebhook() { throw new Error("verifyWebhook must be implemented by the payment provider"); }
  async refund() { throw new Error("refund must be implemented by the payment provider"); }
}
