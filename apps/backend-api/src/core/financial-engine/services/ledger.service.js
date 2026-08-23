import { LEDGER_ENTRY_TYPE } from "../constants/index.js";
import { assertMinor, requireIdempotencyKey } from "../utils/money.js";

const types = new Set(Object.values(LEDGER_ENTRY_TYPE));
function validate(entry) {
    if (!types.has(entry.type)) throw new TypeError(`Unsupported ledger entry type: ${entry.type}`);
    assertMinor(entry.amountMinor, "ledger.amountMinor");
    requireIdempotencyKey(entry.idempotencyKey);
    if (!["CREDIT", "DEBIT"].includes(entry.direction))
        throw new TypeError("Ledger direction must be CREDIT or DEBIT");
    return { ...entry, moneyUnit: "PAISE" };
}

export function createLedgerService(repositories) {
    return Object.freeze({
        async record(entry) {
            if (!repositories.ledger?.append)
                throw new Error("Ledger repository is not configured");
            return repositories.ledger.append(validate(entry));
        },
        async recordMany(entries) {
            if (!repositories.ledger?.appendMany)
                throw new Error("Ledger repository is not configured");
            return repositories.ledger.appendMany(entries.map(validate));
        },
    });
}
