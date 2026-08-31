import {
    publish,
    publishFanOut,
    publishToCatalog,
    publishToUser,
    setRealtimeServer,
    isRealtimeActive,
} from "../../realtime/realtime.publisher.js";
import { REALTIME_EVENTS, room } from "../../realtime/realtime.constants.js";
import { bookingPaymentDto, tourDto } from "../../realtime/realtime.dto.js";

const createFakeIo = () => {
    const emissions = [];
    return {
        emissions,
        to(rooms) {
            return {
                emit: (event, payload) => {
                    emissions.push({
                        rooms: Array.isArray(rooms) ? rooms : [rooms],
                        event,
                        payload,
                    });
                },
            };
        },
    };
};

const PAYMENT = {
    _id: "507f1f77bcf86cd7994390aa",
    bookingId: "507f1f77bcf86cd7994390bb",
    agencyId: "507f1f77bcf86cd7994390cc",
    createdBy: "507f1f77bcf86cd7994390dd",
    amount: 2500,
    amountMinor: 250000,
    currency: "INR",
    type: "TOKEN",
    status: "PAID",
    paymentMethod: "UPI",
    provider: "razorpay",
};

afterEach(() => {
    setRealtimeServer(null);
});

describe("realtime publisher", () => {
    test("emits the standardized envelope to exactly the targeted room", async () => {
        const io = createFakeIo();
        setRealtimeServer(io);
        expect(isRealtimeActive()).toBe(true);

        const sent = await publishToUser("user-1", REALTIME_EVENTS.PAYMENT_SUCCESS, {
            status: "PAID",
        });
        expect(sent).toBe(true);
        expect(io.emissions).toHaveLength(1);
        const { rooms, event, payload } = io.emissions[0];
        expect(rooms).toEqual(["user:user-1"]);
        expect(event).toBe("payment:success");
        expect(payload.eventId).toBeTruthy();
        expect(typeof payload.timestamp).toBe("string");
        expect(payload.version).toBe(1);
        expect(payload.data).toEqual({ status: "PAID" });
    });

    test("fan-out deduplicates rooms and can skip admins", async () => {
        const io = createFakeIo();
        setRealtimeServer(io);

        await publishFanOut(
            { userId: "u1", agencyId: null },
            "x:y",
            { a: 1 },
            { skipAdmins: true },
        );
        expect(io.emissions[0].rooms).toEqual(["user:u1"]);
    });

    test("is a safe no-op when realtime is not attached", async () => {
        const sent = await publishToUser("u2", "x:y", {});
        expect(sent).toBe(false);
    });

    test("socket publication failures never escape into the HTTP business flow", async () => {
        setRealtimeServer({
            to() {
                throw new Error("socket adapter unavailable");
            },
        });

        await expect(publishToUser("u2", "enquiry:created", {})).resolves.toBe(false);
    });

    test("payment DTO exposes only whitelisted fields", () => {
        const dto = bookingPaymentDto(PAYMENT);
        expect(Object.keys(dto).sort()).toEqual(
            [
                "agencyId",
                "amount",
                "amountMinor",
                "bookingId",
                "createdBy",
                "currency",
                "paymentDate",
                "paymentId",
                "paymentMethod",
                "provider",
                "status",
                "type",
                "verifiedAt",
            ].sort(),
        );
        expect(JSON.stringify(dto)).not.toMatch(/raw|signature|secret/i);
    });

    test("tour DTO carries public card flags for realtime invalidation", () => {
        const dto = tourDto({
            _id: "tour-1",
            title: "Rajasthan Tour",
            status: "published",
            featured: true,
            trending: false,
            tremVerified: true,
            password: "must-not-leak",
        });

        expect(dto).toEqual(
            expect.objectContaining({
                tourId: "tour-1",
                isPublished: true,
                featured: true,
                trending: false,
                tremVerified: true,
            }),
        );
        expect(dto).not.toHaveProperty("password");
    });

    test("unrelated rooms never receive an event", async () => {
        const io = createFakeIo();
        setRealtimeServer(io);
        await publishToUser("owner-user", "a:b", {});
        const allRooms = io.emissions.flatMap((e) => e.rooms);
        expect(allRooms).not.toContain("user:intruder");
    });

    test("catalog broadcast targets the shared catalog room", async () => {
        expect(room.catalog()).toBe("catalog");

        const io = createFakeIo();
        setRealtimeServer(io);
        const sent = await publishToCatalog(REALTIME_EVENTS.TOUR_PUBLISHED, { tourId: "t1" });
        expect(sent).toBe(true);
        expect(io.emissions[0].rooms).toEqual(["catalog"]);
        expect(io.emissions[0].event).toBe("tour:published");
        expect(io.emissions[0].payload.data).toEqual({ tourId: "t1" });
    });

    test("TOUR_CREATED is a registered realtime event", () => {
        expect(REALTIME_EVENTS.TOUR_CREATED).toBe("tour:created");
    });
});
