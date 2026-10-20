import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const userRoles = ["super_admin", "admin", "hr", "manager"] as const;
export type UserRole = (typeof userRoles)[number];

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      required: true,
      enum: userRoles,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ email: 1 }, { unique: true });

export type UserRecord = InferSchemaType<typeof userSchema>;

export const UserModel =
  mongoose.models.User ?? mongoose.model("User", userSchema);
