import "server-only";

import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/authorization";
import { connectToDatabase } from "@/lib/mongodb";
import {
  EmployeeModel,
  type EmploymentStatus,
  type EmploymentType,
} from "@/models/employee";

export type EmployeeSummary = {
  id: string;
  employeeNumber: string;
  fullName: string;
  workEmail: string;
  department: string;
  position: string;
  level: string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  startDate: string;
  contractEndDate: string;
  contractDurationMonths: number | null;
  contractHistory?: Array<{
    action: "extended" | "converted" | "completed";
    previousEmploymentType: EmploymentType;
    newEmploymentType: EmploymentType;
    previousEndDate: string;
    newEndDate?: string;
    reason: string;
    recordedAt: string;
  }>;
  dateOfBirth?: string;
  birthPlace?: string;
  domicile?: string;
  educationInstitution?: string;
  major?: string;
  studentId?: string;
  phone?: string;
  socialMediaUsername?: string;
};

export type EmployeeListView = "all" | "active" | "ending-soon";
export const employeePageSizes = [10, 20, 30, 50, 100] as const;
export type EmployeePageSize = (typeof employeePageSizes)[number];

export type EmployeeListResult = {
  employees: EmployeeSummary[];
  total: number;
  currentPage: number;
  pageSize: EmployeePageSize;
  pageCount: number;
};

export type EmployeeDashboardStats = {
  activeCount: number;
  endingSoonCount: number;
  endingSoonEmployees: Array<EmployeeSummary & { daysRemaining: number }>;
};

const workFields =
  "employeeNumber fullName workEmail department position level employmentType employmentStatus startDate contractEndDate contractDurationMonths";
const privateFields =
  "dateOfBirth birthPlace domicile educationInstitution major studentId phone socialMediaUsername";
const millisecondsPerDay = 24 * 60 * 60 * 1000;

function getJakartaToday(): Date {
  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(dateParts.find((item) => item.type === type)?.value);

  return new Date(Date.UTC(part("year"), part("month") - 1, part("day")));
}

function getEndingSoonFilter(today = getJakartaToday()) {
  const throughDate = new Date(today.getTime() + 14 * millisecondsPerDay);
  return {
    employmentStatus: "active" as const,
    contractEndDate: { $gte: today, $lte: throughDate },
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getEmployeeFilter(searchTerm: string, view: EmployeeListView) {
  const normalizedSearch = searchTerm.trim().slice(0, 100);
  const conditions = [];
  if (normalizedSearch) {
    conditions.push({
      $or: [
        {
          employeeNumber: {
            $regex: escapeRegExp(normalizedSearch),
            $options: "i",
          },
        },
        {
          fullName: {
            $regex: escapeRegExp(normalizedSearch),
            $options: "i",
          },
        },
        {
          department: {
            $regex: escapeRegExp(normalizedSearch),
            $options: "i",
          },
        },
      ],
    });
  }
  if (view === "active") {
    conditions.push({ employmentStatus: "active" });
  } else if (view === "ending-soon") {
    conditions.push(getEndingSoonFilter());
  }

  return conditions.length > 0 ? { $and: conditions } : {};
}

export async function getEmployees(
  searchTerm = "",
  view: EmployeeListView = "active",
  requestedPage = 1,
  requestedPageSize: number = 10,
): Promise<EmployeeListResult> {
  await requireUser();
  await connectToDatabase();
  const normalizedSearch = searchTerm.trim().slice(0, 100);
  const pageSize =
    employeePageSizes.find((size) => size === requestedPageSize) ?? 10;
  const page = Number.isSafeInteger(requestedPage)
    ? Math.max(1, requestedPage)
    : 1;
  const filter = getEmployeeFilter(normalizedSearch, view);
  const total = await EmployeeModel.countDocuments(filter).exec();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const employees = await EmployeeModel.find(filter)
    .select(workFields)
    .sort({ fullName: 1, _id: 1 })
    .skip((currentPage - 1) * pageSize)
    .limit(pageSize)
    .lean()
    .exec();

  return {
    employees: employees.map((employee) => toEmployeeSummary(employee)),
    total,
    currentPage,
    pageSize,
    pageCount,
  };
}

export async function getEmployeesForExport(
  searchTerm: string,
  view: EmployeeListView,
): Promise<{ employees: EmployeeSummary[]; includePrivateData: boolean }> {
  const user = await requireUser(["admin", "hr"]);
  await connectToDatabase();

  const includePrivateData = user.role === "super_admin" || user.role === "hr";
  const employees = await EmployeeModel.find(getEmployeeFilter(searchTerm, view))
    .select(`${workFields}${includePrivateData ? ` ${privateFields}` : ""}`)
    .sort({ fullName: 1, _id: 1 })
    .lean()
    .exec();

  return {
    employees: employees.map((employee) =>
      toEmployeeSummary(employee, includePrivateData),
    ),
    includePrivateData,
  };
}

export async function getEmployeeDashboardStats(): Promise<EmployeeDashboardStats> {
  await requireUser();
  await connectToDatabase();

  const today = getJakartaToday();
  const endingSoonFilter = getEndingSoonFilter(today);
  const [activeCount, endingSoonCount, upcoming] = await Promise.all([
    EmployeeModel.countDocuments({ employmentStatus: "active" }).exec(),
    EmployeeModel.countDocuments(endingSoonFilter).exec(),
    EmployeeModel.find(endingSoonFilter)
      .select(workFields)
      .sort({ contractEndDate: 1, fullName: 1 })
      .limit(10)
      .lean()
      .exec(),
  ]);

  return {
    activeCount,
    endingSoonCount,
    endingSoonEmployees: upcoming.map((employee) => {
      if (!employee.contractEndDate) {
        throw new Error(
          "An expiring employee record is missing its contract end date.",
        );
      }

      return {
        ...toEmployeeSummary(employee),
        daysRemaining: Math.max(
          0,
          Math.round(
            (employee.contractEndDate.getTime() - today.getTime()) /
              millisecondsPerDay,
          ),
        ),
      };
    }),
  };
}

export async function getEmployeeById(id: string): Promise<EmployeeSummary> {
  const user = await requireUser();
  if (!mongoose.isValidObjectId(id)) {
    notFound();
  }

  await connectToDatabase();
  const canSeePrivateData = user.role === "super_admin" || user.role === "hr";
  const canSeeContractHistory =
    user.role === "super_admin" || user.role === "admin" || user.role === "hr";
  const employee = await EmployeeModel.findById(id)
    .select(
      `${workFields}${canSeeContractHistory ? " contractHistory" : ""}${canSeePrivateData ? ` ${privateFields}` : ""}`,
    )
    .lean()
    .exec();
  if (!employee) {
    notFound();
  }

  return toEmployeeSummary(employee, canSeePrivateData);
}

function toEmployeeSummary(
  employee: {
  _id: mongoose.Types.ObjectId;
  employeeNumber: string;
  fullName: string;
  workEmail?: string;
  department: string;
  position: string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  startDate: Date;
  contractEndDate?: Date;
  level?: string;
  contractDurationMonths?: number;
  contractHistory?: Array<{
    action: "extended" | "converted" | "completed";
    previousEmploymentType: EmploymentType;
    newEmploymentType: EmploymentType;
    previousEndDate: Date;
    newEndDate?: Date;
    reason: string;
    recordedAt: Date;
  }>;
  dateOfBirth?: Date;
  birthPlace?: string;
  domicile?: string;
  educationInstitution?: string;
  major?: string;
  studentId?: string;
  phone?: string;
  socialMediaUsername?: string;
  },
  includePrivate = false,
): EmployeeSummary {
  return {
    id: employee._id.toString(),
    employeeNumber: employee.employeeNumber,
    fullName: employee.fullName,
    workEmail: employee.workEmail ?? "",
    department: employee.department,
    position: employee.position,
    level: employee.level ?? "",
    employmentType: employee.employmentType,
    employmentStatus: employee.employmentStatus,
    startDate: employee.startDate.toISOString().slice(0, 10),
    contractEndDate: employee.contractEndDate?.toISOString().slice(0, 10) ?? "",
    contractDurationMonths: employee.contractDurationMonths ?? null,
    ...(employee.contractHistory
      ? {
          contractHistory: employee.contractHistory.map((record) => ({
            action: record.action,
            previousEmploymentType: record.previousEmploymentType,
            newEmploymentType: record.newEmploymentType,
            previousEndDate: record.previousEndDate.toISOString().slice(0, 10),
            newEndDate: record.newEndDate?.toISOString().slice(0, 10),
            reason: record.reason,
            recordedAt: record.recordedAt.toISOString(),
          })),
        }
      : {}),
    ...(includePrivate
      ? {
          dateOfBirth: employee.dateOfBirth?.toISOString().slice(0, 10),
          birthPlace: employee.birthPlace,
          domicile: employee.domicile,
          educationInstitution: employee.educationInstitution,
          major: employee.major,
          studentId: employee.studentId,
          phone: employee.phone,
          socialMediaUsername: employee.socialMediaUsername,
        }
      : {}),
  };
}
