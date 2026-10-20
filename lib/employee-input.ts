import {
  employmentStatuses,
  employmentTypes,
  type EmploymentStatus,
  type EmploymentType,
} from "@/models/employee";

export type EmployeeWriteInput = {
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
  dateOfBirth?: Date;
  birthPlace?: string;
  domicile?: string;
  educationInstitution?: string;
  major?: string;
  studentId?: string;
  phone?: string;
  socialMediaUsername?: string;
};

export type EmployeeInputResult =
  | { success: true; value: EmployeeWriteInput }
  | { success: false; message: string };

function isOneOf<const T extends readonly string[]>(
  values: T,
  candidate: string,
): candidate is T[number] {
  return values.some((value) => value === candidate);
}

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? date
    : null;
}

function optionalText(formData: FormData, key: string, maxLength: number) {
  const value = String(formData.get(key) ?? "").trim();
  if (value.length > maxLength) {
    return null;
  }
  return value || undefined;
}

export function parseEmployeeInput(formData: FormData): EmployeeInputResult {
  const employeeNumber = String(formData.get("employeeNumber") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const workEmail = String(formData.get("workEmail") ?? "").trim().toLowerCase();
  const department = String(formData.get("department") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const employmentType = String(formData.get("employmentType") ?? "");
  const employmentStatus = String(formData.get("employmentStatus") ?? "active");
  const startDateText = String(formData.get("startDate") ?? "");
  const contractEndDateText = String(formData.get("contractEndDate") ?? "");
  const level = optionalText(formData, "level", 100);
  const contractDurationText = String(
    formData.get("contractDurationMonths") ?? "",
  ).trim();
  const birthPlace = optionalText(formData, "birthPlace", 150);
  const domicile = optionalText(formData, "domicile", 150);
  const educationInstitution = optionalText(
    formData,
    "educationInstitution",
    200,
  );
  const major = optionalText(formData, "major", 150);
  const studentId = optionalText(formData, "studentId", 64);
  const phone = optionalText(formData, "phone", 32);
  const socialMediaUsername = optionalText(
    formData,
    "socialMediaUsername",
    150,
  );

  if (
    level === null ||
    birthPlace === null ||
    domicile === null ||
    educationInstitution === null ||
    major === null ||
    studentId === null ||
    phone === null ||
    socialMediaUsername === null
  ) {
    return {
      success: false,
      message: "Salah satu data tambahan melebihi batas panjang yang diizinkan.",
    };
  }

  if (
    !employeeNumber ||
    employeeNumber.length > 32 ||
    !fullName ||
    fullName.length > 150 ||
    !department ||
    department.length > 100 ||
    !position ||
    position.length > 100
  ) {
    return {
      success: false,
      message: "Lengkapi nomor karyawan, nama, departemen, dan jabatan dengan benar.",
    };
  }

  if (
    workEmail.length > 254 ||
    (workEmail !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail))
  ) {
    return { success: false, message: "Format email kerja tidak valid." };
  }

  if (
    !isOneOf(employmentTypes, employmentType) ||
    !isOneOf(employmentStatuses, employmentStatus)
  ) {
    return {
      success: false,
      message: "Tipe atau status hubungan kerja tidak valid.",
    };
  }

  const startDate = parseDate(startDateText);
  const parsedContractEndDate = contractEndDateText
    ? parseDate(contractEndDateText)
    : null;
  const contractEndDate = parsedContractEndDate ?? undefined;

  if (!startDate) {
    return { success: false, message: "Tanggal mulai kerja tidak valid." };
  }

  if (contractEndDateText && !parsedContractEndDate) {
    return { success: false, message: "Tanggal akhir kontrak tidak valid." };
  }

  if (contractEndDate && contractEndDate < startDate) {
    return {
      success: false,
      message: "Tanggal akhir kontrak harus sama dengan atau setelah tanggal mulai.",
    };
  }

  if (employmentType !== "permanent" && !contractEndDate) {
    return {
      success: false,
      message: "Tanggal akhir wajib diisi untuk karyawan kontrak dan intern.",
    };
  }

  let contractDurationMonths: number | undefined;
  if (contractDurationText) {
    contractDurationMonths = Number(contractDurationText);
    if (
      !Number.isInteger(contractDurationMonths) ||
      contractDurationMonths < 0 ||
      contractDurationMonths > 1200
    ) {
      return {
        success: false,
        message: "Durasi kontrak harus berupa bilangan bulan yang valid.",
      };
    }
  }

  const dateOfBirthText = String(formData.get("dateOfBirth") ?? "").trim();
  const parsedDateOfBirth = dateOfBirthText
    ? parseDate(dateOfBirthText)
    : null;
  if (dateOfBirthText && !parsedDateOfBirth) {
    return { success: false, message: "Tanggal lahir tidak valid." };
  }
  const dateOfBirth = parsedDateOfBirth ?? undefined;

  return {
    success: true,
    value: {
      employeeNumber,
      fullName,
      workEmail: workEmail || undefined,
      department,
      position,
      employmentType,
      employmentStatus,
      startDate,
      contractEndDate,
      level,
      contractDurationMonths,
      dateOfBirth,
      birthPlace,
      domicile,
      educationInstitution,
      major,
      studentId,
      phone,
      socialMediaUsername,
    },
  };
}
