import mongoose from "mongoose";
import config from "./env.js";

const connectDB = async () => {
  try {
    const mongoUri = (config.MONGO_URI || "").trim();

    if (!mongoUri || mongoUri.includes("HOST")) {
      throw new Error(
        "Invalid MONGO_URI. Set the deployed environment variable to your full MongoDB Atlas connection string, including the real cluster hostname."
      );
    }

    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected..");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

export default connectDB;
