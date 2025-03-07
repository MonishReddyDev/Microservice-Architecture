import dotenv from "dotenv";
import mongoose from "mongoose";
import logger from "./utils/logger";
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import routes from "./routes/identity-routes";
import errorHandler from "./middleware/error-handler";
import { rateLimit } from "express-rate-limit";
import { RateLimiterRedis } from "rate-limiter-flexible";
import redisClient from "./config/redis";
import connectDB from "./config/database";

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

// DDos protection and rate limiting
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10, // Max 10 requests per IP per second
  duration: 1, // in seconds
});

app.use((req: Request | any, res: Response, next: NextFunction) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({ success: false, message: "Too many requests" });
    });
});

// IP-based rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit to 50 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
  // store: new RedisStore({
  //   sendCommand: (...args: any[]) => redisClient.call(...args),
  // }),
});

// Apply sensitiveEndpointsLimiter to specific routes
app.use("/api/auth/register", sensitiveEndpointsLimiter);

// Routes
app.use("/api/auth", routes);

app.get("/api/auth/get", sensitiveEndpointsLimiter, (req, res) => {
  res.send("success");
});

// Error handler
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  logger.info(`Identity service running on port ${PORT}`);
});

// Unhandled promise rejection handling
process.on("unhandledRejection", (reason: Error, promise: Promise<any>) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
