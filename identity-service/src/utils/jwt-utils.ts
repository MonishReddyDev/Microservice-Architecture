import jwt from "jsonwebtoken";
import crypto from "crypto";
import { IUser } from "../models/user-model";
import RefreshToken, { IRefreshToken } from "../models/refreshToken-model";

const JWT_SECRET = (process.env.JWT_SECRET as string) || "qrtywuiehfgdjhsdhfe";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

// Function to generate access & refresh tokens
export const generateTokens = async (
  user: IUser
): Promise<{ accessToken: string; refreshToken: string }> => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: "60m" }
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Refresh token expires in 7 days

  const refreshTokenDoc: IRefreshToken = new RefreshToken({
    token: refreshToken,
    user: user._id,
    expiresAt,
  });

  await refreshTokenDoc.save();

  return { accessToken, refreshToken };
};
