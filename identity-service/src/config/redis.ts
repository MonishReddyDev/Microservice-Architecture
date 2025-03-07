import Redis from "ioredis";
import logger from "../utils/logger";

const redisClient = new Redis(process.env.REDIS_URL as string);

redisClient.on("connect", () => {
  logger.info("Redis Database is connected");
});

redisClient.on("error", (err: Error) => {
  logger.info("Error while connecting to Redis Database!");
});

export default redisClient;
