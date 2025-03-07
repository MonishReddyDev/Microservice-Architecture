import { Request, Response } from "express";
import logger from "../utils/logger";
import User from "../models/user-model";
import { generateTokens } from "../utils/jwt-utils";
import { validateLogin, validateRegistration } from "../utils/validation";
import RefreshToken from "../models/refreshToken-model";

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

export const loginUser = async (req: Request, res: Response) => {
  try {
    // Validate the schema

    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
      return;
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn("Invalid User!");
      res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
      return;
    }

    //check the password
    const isValidPassword = await user.comparePassword(password);
    console.log("isValidPassword:", isValidPassword);

    if (!isValidPassword) {
      logger.warn("Invalid Password!");
      res.status(400).json({
        success: false,
        message: "Invalid Password",
      });
      return;
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error("Login error occured", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const RefreshUserToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    console.log(refreshToken);
    if (!refreshToken) {
      logger.warn("Refresh token missing");
      res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
      return;
    }
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Invalid or expired refresh token");
      res.status(401).json({
        success: false,
        message: `Invalid or expired refresh token`,
      });
      return;
    }

    const user = await User.findById(storedToken.user);
    if (!user) {
      logger.warn("User not found");
      res.status(401).json({
        success: false,
        message: `User not found`,
      });
      return;
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateTokens(user);

    //delete the old refresh token
    await RefreshToken.deleteOne({ _id: storedToken._id });
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Refresh token error occured", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  logger.info("Logout endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing");
      res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
      return;
    }

    await RefreshToken.deleteOne({ token: refreshToken });
    logger.info("Refresh token deleted for logout");

    res.json({
      success: true,
      message: "Logged out successfully!",
    });
  } catch (e) {
    logger.error("Error while logging out", e);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
