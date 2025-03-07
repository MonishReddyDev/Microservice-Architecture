import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import logger from "../utils/logger";

const MONGO_URI = process.env.MONGODB_URI as string;

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI, {} as mongoose.ConnectOptions);
    logger.info("Connected to mongodb");
  } catch (error) {
    logger.error("Mongo connection error", error);
    process.exit(1); // Exit process if connection fails
  }
};

export default connectDB;
