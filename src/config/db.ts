import mongoose from "mongoose";

const connectDB = async () => {
  await mongoose
    .connect(process.env.MONGO_URI ?? "", {
      dbName: process.env.MONGO_DB_NAME ?? "IEEE",
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    })
    .then(() => {
      console.log("✅ Connected to MongoDB");
    })
    .catch((err) => {
      console.error("❌ Failed to connect to MongoDB", err);
      process.exit(1);
    });
};

export default connectDB;
