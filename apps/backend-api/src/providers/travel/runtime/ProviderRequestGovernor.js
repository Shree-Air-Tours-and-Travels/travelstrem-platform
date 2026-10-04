const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const isThrottled = (error) =>
    Number(error?.status || error?.statusCode || error?.response?.status) === 429
    || ["RATE_LIMITED", "TOO_MANY_REQUESTS", "THROTTLED"].includes(String(error?.code || "").toUpperCase());

export default class ProviderRequestGovernor {
    constructor(config, now = () => Date.now()) {
        this.config = config;
        this.now = now;
        this.requestTimes = [];
        this.lastRequestAt = 0;
        this.quotaUsed = 0;
        this.quotaResetAt = now() + config.quota.resetMs;
        this.scheduler = Promise.resolve();
    }

    async reserve() {
        const previous = this.scheduler;
        let release;
        this.scheduler = new Promise((resolve) => { release = resolve; });
        await previous;
        try {
            while (true) {
                const current = this.now();
                if (current >= this.quotaResetAt) {
                    this.quotaUsed = 0;
                    this.quotaResetAt = current + this.config.quota.resetMs;
                }
                if (this.config.quota.max && this.quotaUsed >= this.config.quota.max) {
                    const error = new Error(`Hotel provider ${this.config.name} usage quota has been reached.`);
                    error.code = "PROVIDER_QUOTA_EXCEEDED";
                    throw error;
                }
                this.requestTimes = this.requestTimes.filter((time) => current - time < this.config.rateLimit.windowMs);
                const rateWait = this.requestTimes.length >= this.config.rateLimit.requests
                    ? this.config.rateLimit.windowMs - (current - this.requestTimes[0]) : 0;
                const intervalWait = this.lastRequestAt
                    ? this.config.throttling.intervalMs - (current - this.lastRequestAt) : 0;
                const delay = Math.max(0, rateWait, intervalWait);
                if (delay) {
                    await wait(delay);
                    continue;
                }
                this.requestTimes.push(current);
                this.lastRequestAt = current;
                this.quotaUsed += 1;
                return;
            }
        } finally {
            release();
        }
    }

    async run(operation) {
        for (let attempt = 0; ; attempt += 1) {
            await this.reserve();
            try {
                return await operation();
            } catch (error) {
                if (!isThrottled(error) || attempt >= this.config.throttling.retryLimit) throw error;
                const retryAfter = Number(error?.response?.headers?.["retry-after"] || error?.retryAfterSeconds);
                await wait(Number.isFinite(retryAfter) && retryAfter >= 0
                    ? retryAfter * 1000
                    : Math.max(this.config.throttling.intervalMs, this.config.rateLimit.windowMs));
            }
        }
    }
}
