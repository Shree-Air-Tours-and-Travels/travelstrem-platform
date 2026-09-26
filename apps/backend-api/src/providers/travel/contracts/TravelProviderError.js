export default class TravelProviderError extends Error {
    constructor(providerName, operation, message, details = undefined) {
        super(message);
        this.name = "TravelProviderError";
        this.providerName = providerName;
        this.operation = operation;
        this.details = details;
    }
}
