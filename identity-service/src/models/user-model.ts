import mongoose, { Schema, Document } from "mongoose";
import argon2 from "argon2";

// Interface for TypeScript typing
export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    createdAt?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
UserSchema.pre < IUser > ("save", async function (next) {
    if (this.isModified("password")) {
        try {
            this.password = await argon2.hash(this.password);
        } catch (error) {
            return next(error as Error);
        }
    }
    next();
});

// Compare hashed password
UserSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    try {
        return await argon2.verify(this.password, candidatePassword);
    } catch (error) {
        throw error;
    }
};

// Add a text index for searching by username
UserSchema.index({ username: "text" });

const User = mongoose.model < IUser > ("User", UserSchema);
export default User;
