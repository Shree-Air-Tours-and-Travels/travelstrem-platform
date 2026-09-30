import TravelProviderError from "./TravelProviderError.js";

export default class BaseTravelProvider {
    constructor({ name, enabled = true, config = {} } = {}) {
        if (!name)
            throw new TravelProviderError("unknown", "constructor", "Provider name is required");
        this.name = name;
        this.enabled = enabled;
        this.config = config;
    }

    assertEnabled(operation) {
        if (!this.enabled) {
            throw new TravelProviderError(this.name, operation, "Provider is disabled");
        }
    }

    unsupported(operation) {
        throw new TravelProviderError(this.name, operation, `${operation} is not implemented`);
    }
}
