import mongoose from "mongoose";
import config from "../config/index.js";
import BookingQuote from "../modules/bookings/models/BookingQuote.js";

await mongoose.connect(config.MONGO_URI);

const indexes = await BookingQuote.collection.indexes();
const byName = (name) => indexes.find((index) => index.name === name);
const incompatible = [];

const legacy = byName("bookingId_1_version_1");
if (
    legacy &&
    !(
        legacy.partialFilterExpression?.bookingId?.$type === "objectId" &&
        legacy.partialFilterExpression?.version?.$type === "number"
    )
)
    incompatible.push(legacy.name);

const inquiry = byName("inquiryId_1_version_1");
if (
    inquiry &&
    !(
        inquiry.partialFilterExpression?.inquiryId?.$type === "objectId" &&
        inquiry.partialFilterExpression?.version?.$type === "number"
    )
)
    incompatible.push(inquiry.name);

const quoteNumber = byName("quoteNumber_1");
if (
    quoteNumber &&
    !(
        quoteNumber.partialFilterExpression?.quoteType === "BOOKING_V2" &&
        quoteNumber.partialFilterExpression?.quoteNumber?.$type === "string"
    )
)
    incompatible.push(quoteNumber.name);

const expiry = byName("booking_quote_expiry") || byName("expiresAt_1");
if (
    expiry &&
    !(expiry.expireAfterSeconds === 0 && expiry.partialFilterExpression?.quoteType === "BOOKING_V2")
)
    incompatible.push(expiry.name);

for (const name of [...new Set(incompatible)]) {
    await BookingQuote.collection.dropIndex(name);
    console.log(`Dropped obsolete ${name} index.`);
}

await BookingQuote.createIndexes();
const verified = await BookingQuote.collection.indexes();
console.log(
    JSON.stringify(
        verified.filter((index) =>
            [
                "bookingId_1_version_1",
                "inquiryId_1_version_1",
                "quoteNumber_1",
                "booking_quote_expiry",
            ].includes(index.name),
        ),
        null,
        2,
    ),
);
console.log("Booking quote indexes are compatible with LEGACY and BOOKING_V2 records.");
await mongoose.disconnect();
