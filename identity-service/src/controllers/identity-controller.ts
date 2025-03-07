import { Request, Response } from "express";
import logger from "../utils/logger";
import User from "../models/user-model";
import { generateTokens } from "../utils/jwt-utils";
import { validateRegistration } from "../utils/validation";

// Register User Handler
export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  logger.info("Registration endpoint hit...");

  try {
    // Validate the schema
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
      return;
    }

    const { email, password, username } = req.body;

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn("User already exists");
      res.status(400).json({
        success: false,
        message: "User already exists",
      });
      return;
    }

    user = new User({ username, email, password });
    await user.save();
    logger.info("User saved successfully", { userId: user._id });

    const { accessToken, refreshToken } = await generateTokens(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully!",
      accessToken,
      refreshToken,
    });
  } catch (e) {
    logger.error("Registration error occurred", e);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
