import mongoose, { Schema, Document } from "mongoose";

// Define an interface for TypeScript typing
export interface IRefreshToken extends Document {
  token: string;
  user: mongoose.Schema.Types.ObjectId;
  expiresAt: Date;
}

const RefreshTokenSchema: Schema<IRefreshToken> = new Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Expiry index for automatic token deletion
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model<IRefreshToken>(
  "RefreshToken",
  RefreshTokenSchema
);
export default RefreshToken;
