import mongoose from "mongoose";
import { REALTIME_ERROR_CODES, REALTIME_RESOURCES } from "./realtime.constants.js";

const MAX_COMMAND_PAYLOAD_CHARS = 512;

const isValidId = (value) => {
    if (typeof value !== "string" || value.length > 64 || !/^[a-f\d]{24}$/i.test(value))
        return false;
    return mongoose.Types.ObjectId.isValid(value);
};

/**
 * Validates a client subscription/unsubscription command payload.
 * Returns { ok: true, resource, id } or { ok: false, code, message }.
 */
export function validateSubscriptionPayload(payload) {
    if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
        return {
            ok: false,
            ...{
                code: REALTIME_ERROR_CODES.INVALID_PAYLOAD,
                message: "Malformed subscription payload.",
            },
        };
    }
    let serialized;
    try {
        serialized = JSON.stringify(payload);
    } catch {
        return {
            ok: false,
            code: REALTIME_ERROR_CODES.INVALID_PAYLOAD,
            message: "Malformed subscription payload.",
        };
    }
    if (serialized.length > MAX_COMMAND_PAYLOAD_CHARS) {
        return {
            ok: false,
            code: REALTIME_ERROR_CODES.INVALID_PAYLOAD,
            message: "Subscription payload is too large.",
        };
    }
    const { resource, id } = payload;
    if (!REALTIME_RESOURCES.includes(resource)) {
        return {
            ok: false,
            code: REALTIME_ERROR_CODES.INVALID_PAYLOAD,
            message: `Unknown resource '${String(resource).slice(0, 32)}'.`,
        };
    }
    if (!isValidId(id)) {
        return {
            ok: false,
            code: REALTIME_ERROR_CODES.INVALID_PAYLOAD,
            message: "A valid resource id is required.",
        };
    }
    return { ok: true, resource, id };
}

export { isValidId };
