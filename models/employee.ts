import mongoose, { Schema, type InferSchemaType } from "mongoose";
import {
  employmentTypes,
  type EmploymentType,
} from "@/lib/employment-types";

export { employmentTypes };
export type { EmploymentType };
export const employmentStatuses = [
  "active",
  "on_leave",
  "ended",
  "resigned",
  "completed",
] as const;

export type EmploymentStatus = (typeof employmentStatuses)[number];

const contractHistorySchema = new Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ["extended", "converted", "completed"],
    },
    previousEmploymentType: {
      type: String,
      required: true,
      enum: employmentTypes,
    },
    newEmploymentType: {
      type: String,
      required: true,
      enum: employmentTypes,
    },
    previousEndDate: {
      type: Date,
      required: true,
    },
    newEndDate: {
      type: Date,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    recordedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false },
);

const employeeSchema = new Schema(
  {
    employeeNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 32,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    workEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    position: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    level: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    employmentType: {
      type: String,
      required: true,
      enum: employmentTypes,
    },
    employmentStatus: {
      type: String,
      required: true,
      enum: employmentStatuses,
      default: "active",
    },
    startDate: {
      type: Date,
      required: true,
    },
    contractEndDate: {
      type: Date,
    },
    contractDurationMonths: {
      type: Number,
      min: 0,
      max: 1200,
      validate: {
        validator: (value: number) => Number.isInteger(value),
        message: "Contract duration must be a whole number of months.",
      },
    },
    contractHistory: {
      type: [contractHistorySchema],
      default: [],
    },
    dateOfBirth: {
      type: Date,
    },
    birthPlace: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    domicile: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    educationInstitution: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    major: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    studentId: {
      type: String,
      trim: true,
      maxlength: 64,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 32,
    },
    socialMediaUsername: {
      type: String,
      trim: true,
      maxlength: 150,
    },
  },
  {
    timestamps: true,
  },
);

employeeSchema.index({ employeeNumber: 1 }, { unique: true });
employeeSchema.index({ workEmail: 1 }, { unique: true, sparse: true });
employeeSchema.index({ employmentStatus: 1, contractEndDate: 1 });

employeeSchema.pre("validate", function () {
  if (this.employmentType !== "permanent" && !this.contractEndDate) {
    this.invalidate(
      "contractEndDate",
      "Contract end date is required for interns and contract employees.",
    );
  }

  if (
    this.contractEndDate &&
    this.startDate &&
    this.contractEndDate < this.startDate
  ) {
    this.invalidate(
      "contractEndDate",
      "Contract end date must be on or after the start date.",
    );
  }
});

export type Employee = InferSchemaType<typeof employeeSchema>;

export const EmployeeModel =
  mongoose.models.Employee ?? mongoose.model("Employee", employeeSchema);
