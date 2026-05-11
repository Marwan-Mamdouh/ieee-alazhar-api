import mongoose from "mongoose";

const connectDB = async () => {
	const res = await mongoose
		.connect(process.env.MONGO_URI ?? "", {
			dbName: process.env.MONGO_DB_NAME ?? "IEEE",
			bufferCommands: false,
			maxPoolSize: 10,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 5000,
		})
		.then((res) => {
			console.log("✅ MongoDB Connected");
			return res;
		})
		.catch((err) => {
			console.error("❌ Failed to connect to MongoDB", err);
			process.exit(1);
		});

	return { mongoClient: res.connection.getClient() };
};

// Graceful shutdown
const disconnectDB = () => {
	mongoose.disconnect().then(() => {
		console.log("❎ MongoDB disconnected");
	});
};

process.on("SIGINT", disconnectDB);
process.on("SIGTERM", disconnectDB);

export default connectDB;
