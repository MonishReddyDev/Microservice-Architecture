import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import Redis from "ioredis";
import logger from "./utils/logger";
import proxy from "express-http-proxy";
import { error } from "console";
import errorHandler from "./middleware/error-handler";

const app = express();
const PORT = process.env.PORT || 5000;

const redisClient = new Redis(process.env.REDIS_URL as string);

app.use(express.json());
app.use(cors());
app.use(helmet());

// IP-based rate limiting for sensitive endpoints
const rateLimitOpitons = rateLimit({
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

app.use(rateLimitOpitons);

//logginf middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

const proxyOptions = {
  proxyReqPathResolver: (req: Request) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err: Error, res: Response, next: NextFunction) => {
    logger.error(`Proxy error:${err.message}`);
    res
      .status(500)
      .json({ message: "Internal server error,", error: err.message });
  },
};

//setting up proxy for identity-service

app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL as string, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts: any, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        "response Received from identity-service:",
        proxyRes.statusCode
      );
      return proxyResData;
    },
  })
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API-gateway is running on port ${PORT}`);
  logger.info(
    `identity service is running on port ${process.env.IDENTITY_SERVICE_URL}`
  );
  logger.info(`Redis Url: ${process.env.REDIS_URL}`);
});
