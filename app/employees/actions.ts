"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { signOut } from "@/auth";
import { requireUser } from "@/lib/authorization";
import { connectToDatabase } from "@/lib/mongodb";
import { EmployeeModel } from "@/models/employee";
import type { EmployeeActionState } from "@/lib/employee-action-state";
import {
  parseEmployeeInput,
  type EmployeeWriteInput,
} from "@/lib/employee-input";
import { isSelectableEmploymentType } from "@/lib/employment-types";

export async function createEmployee(
  _previousState: EmployeeActionState,
  formData: FormData,
): Promise<EmployeeActionState> {
  const user = await requireUser(["admin", "hr"]);

  const input = parseEmployeeInput(formData);
  if (!input.success) {
    return { success: false, message: input.message };
  }

  await connectToDatabase();

  try {
    await EmployeeModel.create(
      user.role === "admin" ? omitPrivateEmployeeData(input.value) : input.value,
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return {
        success: false,
        message: "Nomor karyawan atau email kerja tersebut sudah terdaftar.",
      };
    }

    throw error;
  }

  revalidatePath("/employees");
  return { success: true, message: "Data karyawan berhasil ditambahkan." };
}

export async function updateEmployee(
  _previousState: EmployeeActionState,
  formData: FormData,
): Promise<EmployeeActionState> {
  const user = await requireUser(["admin", "hr"]);

  const employeeId = String(formData.get("employeeId") ?? "");
  if (!mongoose.isValidObjectId(employeeId)) {
    return { success: false, message: "Data karyawan tidak valid." };
  }

  const input = parseEmployeeInput(formData);
  if (!input.success) {
    return { success: false, message: input.message };
  }

  await connectToDatabase();
  const employee = await EmployeeModel.findById(employeeId);
  if (!employee) {
    return { success: false, message: "Data karyawan tidak ditemukan." };
  }

  employee.set({
    ...(user.role === "admin"
      ? omitPrivateEmployeeData(input.value)
      : input.value),
    employeeNumber: employee.employeeNumber,
  });
  try {
    await employee.save();
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return {
        success: false,
        message: "Nomor karyawan atau email kerja tersebut sudah terdaftar.",
      };
    }

    throw error;
  }

  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}/edit`);
  return { success: true, message: "Data karyawan berhasil diperbarui." };
}

export async function followUpContract(
  _previousState: EmployeeActionState,
  formData: FormData,
): Promise<EmployeeActionState> {
  await requireUser(["admin", "hr"]);

  const employeeId = String(formData.get("employeeId") ?? "");
  const action = String(formData.get("contractAction") ?? "");
  const employmentTypeText = String(formData.get("employmentType") ?? "");
  const newEndDateText = String(formData.get("newEndDate") ?? "");
  const contractDurationText = String(
    formData.get("contractDurationMonths") ?? "",
  ).trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (
    !mongoose.isValidObjectId(employeeId) ||
    (action !== "extended" && action !== "completed")
  ) {
    return { success: false, message: "Data tindak lanjut kontrak tidak valid." };
  }

  if (!reason || reason.length > 500) {
    return {
      success: false,
      message: "Alasan wajib diisi dan maksimal 500 karakter.",
    };
  }

  await connectToDatabase();
  const employee = await EmployeeModel.findById(employeeId);
  if (!employee) {
    return { success: false, message: "Data karyawan tidak ditemukan." };
  }
  if (employee.employmentStatus !== "active" || !employee.contractEndDate) {
    return {
      success: false,
      message: "Tindak lanjut hanya tersedia untuk karyawan aktif dengan tanggal akhir.",
    };
  }

  const previousEndDate = employee.contractEndDate;
  if (action === "completed") {
    const actualEndDate = parseDateOnly(newEndDateText);
    if (!actualEndDate) {
      return { success: false, message: "Tanggal akhir aktual tidak valid." };
    }
    if (
      actualEndDate < employee.startDate ||
      actualEndDate > getJakartaToday()
    ) {
      return {
        success: false,
        message: "Tanggal akhir aktual harus dari tanggal mulai sampai hari ini.",
      };
    }

    employee.contractHistory.push({
      action: "completed",
      previousEmploymentType: employee.employmentType,
      newEmploymentType: employee.employmentType,
      previousEndDate,
      newEndDate: actualEndDate,
      reason,
      recordedAt: new Date(),
    });
    employee.contractEndDate = actualEndDate;
    employee.employmentStatus = "completed";
  } else {
    if (!isSelectableEmploymentType(employmentTypeText)) {
      return {
        success: false,
        message: "Pilih jenis hubungan kerja untuk periode berikutnya.",
      };
    }

    const newEmploymentType = employmentTypeText;
    let newEndDate: Date | undefined;
    let contractDurationMonths: number | undefined;
    let historyAction: "extended" | "converted" = "extended";

    if (newEmploymentType === "permanent") {
      if (newEndDateText || contractDurationText) {
        return {
          success: false,
          message: "Jenis hubungan kerja Tetap tidak menggunakan tanggal akhir atau durasi kontrak.",
        };
      }
      historyAction = "converted";
    } else {
      newEndDate = parseDateOnly(newEndDateText) ?? undefined;
      if (!newEndDate) {
        return { success: false, message: "Tanggal akhir baru tidak valid." };
      }
      if (newEndDate <= previousEndDate) {
        return {
          success: false,
          message:
            "Tanggal akhir baru harus setelah tanggal akhir kontrak saat ini.",
        };
      }

      contractDurationMonths = Number(contractDurationText);
      if (
        !contractDurationText ||
        !Number.isInteger(contractDurationMonths) ||
        contractDurationMonths < 1 ||
        contractDurationMonths > 1200
      ) {
        return {
          success: false,
          message: "Durasi kontrak baru harus berupa 1–1200 bulan.",
        };
      }
    }

    employee.contractHistory.push({
      action: historyAction,
      previousEmploymentType: employee.employmentType,
      newEmploymentType,
      previousEndDate,
      newEndDate,
      reason,
      recordedAt: new Date(),
    });
    employee.employmentType = newEmploymentType;
    employee.contractEndDate = newEndDate;
    employee.contractDurationMonths = contractDurationMonths;
  }

  await employee.save();

  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}`);
  revalidatePath(`/employees/${employeeId}/contract`);
  return {
    success: true,
    message: action === "completed"
      ? "Kontrak selesai dan status karyawan berhasil diperbarui."
      : employmentTypeText === "permanent"
        ? "Perubahan menjadi karyawan tetap berhasil dicatat."
        : "Perubahan jenis hubungan kerja dan perpanjangan berhasil dicatat.",
  };
}

export async function signOutUser() {
  await signOut({ redirectTo: "/login" });
}

function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? date
    : null;
}

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

function isDuplicateKeyError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === 11000;
}

function omitPrivateEmployeeData(
  employee: EmployeeWriteInput,
): Omit<
  EmployeeWriteInput,
  | "dateOfBirth"
  | "birthPlace"
  | "domicile"
  | "educationInstitution"
  | "major"
  | "studentId"
  | "phone"
  | "socialMediaUsername"
> {
  return {
    employeeNumber: employee.employeeNumber,
    fullName: employee.fullName,
    workEmail: employee.workEmail,
    department: employee.department,
    position: employee.position,
    employmentType: employee.employmentType,
    employmentStatus: employee.employmentStatus,
    startDate: employee.startDate,
    contractEndDate: employee.contractEndDate,
    level: employee.level,
    contractDurationMonths: employee.contractDurationMonths,
  };
}
