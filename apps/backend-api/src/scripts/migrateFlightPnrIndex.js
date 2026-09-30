import mongoose from "mongoose";
import connectDB from "../config/database.js";

await connectDB();
try {
    const collection = mongoose.connection.collection("flightbookings");
    const indexes = await collection.indexes();
    const index = indexes.find((item) => Object.keys(item.key).length === 1 && item.key.pnr === 1);
    if (index?.unique && index?.sparse) {
        console.log("Flight PNR index is already unique and sparse.");
    } else {
        // Keep uniqueness enforced while replacing the legacy non-sparse index.
        const name = "pnr_unique_sparse";
        await collection.createIndex({ pnr: 1 }, { name, unique: true, sparse: true });
        if (index && index.name !== name) await collection.dropIndex(index.name);
        console.log("Flight PNR index now permits pending bookings without a PNR.");
    }
} finally {
    await mongoose.disconnect();
}
