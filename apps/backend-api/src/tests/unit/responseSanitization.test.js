import mongoose from "mongoose";
import { sanitizeResponsePayload } from "../../utils/sanitizeResponsePayload.js";

describe("JSON response sanitization", () => {
    test("preserves Mongo identifiers as stable strings and dates as dates", () => {
        const id = new mongoose.Types.ObjectId("6a85cbf9806e273dcd540bcf");
        const createdAt = new Date("2026-08-24T10:00:00.000Z");

        const result = sanitizeResponsePayload({ _id: id, createdAt });

        expect(result._id).toBe("6a85cbf9806e273dcd540bcf");
        expect(result.createdAt).toBe(createdAt);
        expect(JSON.parse(JSON.stringify(result)).createdAt).toBe("2026-08-24T10:00:00.000Z");
    });

    test("removes sensitive credential fields without changing safe data", () => {
        expect(
            sanitizeResponsePayload({
                status: "success",
                user: { email: "member@example.com", password: "secret", passwordHash: "hash" },
            }),
        ).toEqual({ status: "success", user: { email: "member@example.com" } });
    });
});
