import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import mongoose from "mongoose";
import {
  EmployeeModel,
  type EmploymentStatus,
  type EmploymentType,
} from "../models/employee";

type EmployeeImportRecord = {
  employeeNumber: string;
  fullName: string;
  department: string;
  position: string;
  level: string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  startDate: Date;
  contractEndDate?: Date;
  contractDurationMonths: number;
  dateOfBirth?: Date;
  birthPlace?: string;
  domicile?: string;
  educationInstitution?: string;
  major?: string;
  studentId?: string;
  phone?: string;
  socialMediaUsername?: string;
};

const requiredHeaders = [
  "Nomor Pegawai",
  "Nama Lengkap",
  "Divisi",
  "Posisi",
  "Status Kepegawaian",
  "Level",
  "Status",
  "Tanggal Masuk/Onboarding",
  "Durasi Kontrak/Magang (Bulan)",
  "Tanggal Berakhir",
  "Tanggal Lahir",
  "Tempat Lahir (Kab/Kota)",
  "Domisili (Kab/Kota)",
  "Instansi Pendidikan (Sekolah/Universitas)",
  "Jurusan",
  "Nomor Induk Siswa/Mahasiswa",
  "No Telp/WA",
  "Username Social Media",
] as const;

function normalizeEmpty(value: string): string {
  const trimmed = value.trim();
  return ["-", "—", "–", "n/a", "na", "null"].includes(trimmed.toLowerCase())
    ? ""
    : trimmed;
}

function cellToText(
  cell: ExcelJS.Cell,
  rawNumericValues: Map<string, string>,
  rowNumber: number,
  columnNumber: number,
): string {
  const value = cell.value;
  if (value === null || value === undefined) {
    return "";
  }
  if (value instanceof Date) {
    return cell.text;
  }
  if (typeof value === "number") {
    const coordinate = `${rowNumber}:${columnNumber}`;
    return normalizeEmpty(rawNumericValues.get(coordinate) ?? String(value));
  }
  if (typeof value === "string") {
    return normalizeEmpty(value);
  }
  if (typeof value === "object" && value !== null) {
    if ("text" in value && typeof value.text === "string") {
      return normalizeEmpty(value.text);
    }
    if ("richText" in value && Array.isArray(value.richText)) {
      return normalizeEmpty(value.richText.map((part) => part.text).join(""));
    }
    if ("hyperlink" in value && typeof value.hyperlink === "string") {
      return normalizeEmpty(value.hyperlink);
    }
  }

  throw new Error(`Unsupported cell value at worksheet row ${rowNumber}.`);
}

function parseDate(value: string | Date, fieldName: string, rowNumber: number) {
  if (value instanceof Date) {
    const year = value.getUTCFullYear();
    const month = value.getUTCMonth();
    const day = value.getUTCDate();
    return new Date(Date.UTC(year, month, day));
  }

  const trimmed = normalizeEmpty(value);
  const yearFirst = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(trimmed);
  const monthFirst = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(trimmed);
  const year = yearFirst ? Number(yearFirst[1]) : Number(monthFirst?.[3]);
  const month = yearFirst ? Number(yearFirst[2]) : Number(monthFirst?.[1]);
  const day = yearFirst ? Number(yearFirst[3]) : Number(monthFirst?.[2]);

  if (!year || !month || !day) {
    throw new Error(`Invalid ${fieldName} at worksheet row ${rowNumber}.`);
  }

  const result = new Date(Date.UTC(year, month - 1, day));
  if (
    result.getUTCFullYear() !== year ||
    result.getUTCMonth() !== month - 1 ||
    result.getUTCDate() !== day
  ) {
    throw new Error(`Invalid ${fieldName} at worksheet row ${rowNumber}.`);
  }
  return result;
}

function optionalDate(
  cell: ExcelJS.Cell,
  rawNumericValues: Map<string, string>,
  rowNumber: number,
  columnNumber: number,
  fieldName: string,
): Date | undefined {
  const text = cellToText(cell, rawNumericValues, rowNumber, columnNumber);
  return text
    ? parseDate(
        cell.value instanceof Date ? cell.value : text,
        fieldName,
        rowNumber,
      )
    : undefined;
}

function parseEmploymentType(value: string, rowNumber: number): EmploymentType {
  switch (value.trim().toLowerCase()) {
    case "contract":
      return "contract";
    case "internship":
    case "intern":
      return "intern";
    case "permanent":
    case "permanent employee":
      return "permanent";
    default:
      throw new Error(
        `Unsupported employment type at worksheet row ${rowNumber}.`,
      );
  }
}

function parseEmploymentStatus(
  value: string,
  rowNumber: number,
): EmploymentStatus {
  switch (value.trim().toLowerCase()) {
    case "aktif":
    case "active":
      return "active";
    case "cuti":
    case "on leave":
      return "on_leave";
    case "resign":
    case "resigned":
      return "resigned";
    case "selesai":
    case "completed":
      return "completed";
    case "berakhir":
    case "ended":
      return "ended";
    default:
      throw new Error(`Unsupported employee status at worksheet row ${rowNumber}.`);
  }
}

function readRawNumericIdentifiers(
  archive: JSZip,
): Promise<Map<string, string>> {
  const worksheet = archive.file("xl/worksheets/sheet1.xml");
  if (!worksheet) {
    throw new Error("The workbook is missing its first worksheet.");
  }

  return worksheet.async("string").then((xml) => {
    const values = new Map<string, string>();
    const cellPattern = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
    for (const match of xml.matchAll(cellPattern)) {
      const attributes = match[1];
      const reference = /\br="([A-Z]+)(\d+)"/.exec(attributes);
      const cellType = /\bt="([^"]+)"/.exec(attributes)?.[1];
      if (!reference || (cellType && cellType !== "n")) {
        continue;
      }

      const [, column, row] = reference;
      if (!["B", "Q", "R"].includes(column)) {
        continue;
      }

      const rawValue = /<v>([^<]*)<\/v>/.exec(match[2])?.[1];
      if (rawValue && /^\d+$/.test(rawValue)) {
        const columnNumber =
          column === "B" ? 2 : column === "Q" ? 17 : 18;
        values.set(`${Number(row)}:${columnNumber}`, rawValue);
      }
    }

    return values;
  });
}

function toRecord(
  row: ExcelJS.Row,
  columns: Map<string, number>,
  rawNumericValues: Map<string, string>,
): EmployeeImportRecord {
  const rowNumber = row.number;
  const text = (header: (typeof requiredHeaders)[number]) => {
    const column = columns.get(header);
    if (!column) {
      throw new Error("The workbook is missing a required column.");
    }
    return cellToText(row.getCell(column), rawNumericValues, rowNumber, column);
  };
  const date = (header: (typeof requiredHeaders)[number]) => {
    const column = columns.get(header);
    if (!column) {
      throw new Error("The workbook is missing a required date column.");
    }
    return optionalDate(
      row.getCell(column),
      rawNumericValues,
      rowNumber,
      column,
      header,
    );
  };
  const requiredDate = (header: (typeof requiredHeaders)[number]) => {
    const value = date(header);
    if (!value) {
      throw new Error(`Missing ${header} at worksheet row ${rowNumber}.`);
    }
    return value;
  };

  const employeeNumber = text("Nomor Pegawai");
  const fullName = text("Nama Lengkap");
  const department = text("Divisi");
  const position = text("Posisi");
  const level = text("Level");
  const durationText = text("Durasi Kontrak/Magang (Bulan)");
  const contractDurationMonths = Number(durationText);

  if (
    !employeeNumber ||
    !fullName ||
    !department ||
    !position ||
    !level ||
    !Number.isInteger(contractDurationMonths) ||
    contractDurationMonths < 0
  ) {
    throw new Error(`Missing or invalid required data at worksheet row ${rowNumber}.`);
  }

  return {
    employeeNumber,
    fullName,
    department,
    position,
    level,
    employmentType: parseEmploymentType(
      text("Status Kepegawaian"),
      rowNumber,
    ),
    employmentStatus: parseEmploymentStatus(text("Status"), rowNumber),
    startDate: requiredDate("Tanggal Masuk/Onboarding"),
    contractEndDate: date("Tanggal Berakhir"),
    contractDurationMonths,
    dateOfBirth: date("Tanggal Lahir"),
    birthPlace: text("Tempat Lahir (Kab/Kota)") || undefined,
    domicile: text("Domisili (Kab/Kota)") || undefined,
    educationInstitution:
      text("Instansi Pendidikan (Sekolah/Universitas)") || undefined,
    major: text("Jurusan") || undefined,
    studentId: text("Nomor Induk Siswa/Mahasiswa") || undefined,
    phone: text("No Telp/WA") || undefined,
    socialMediaUsername: text("Username Social Media") || undefined,
  };
}

async function main() {
  const workbookPath = resolve(
    process.cwd(),
    process.argv.slice(2).find((argument) => argument !== "--apply") ??
      "../MMP.xlsx",
  );
  const shouldApply = process.argv.includes("--apply");
  const file = await readFile(workbookPath);
  const archive = await JSZip.loadAsync(
    new Uint8Array(file.buffer, file.byteOffset, file.byteLength),
  );
  const rawNumericValues = await readRawNumericIdentifiers(archive);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("The workbook contains no worksheets.");
  }

  const columns = new Map<string, number>();
  worksheet.getRow(1).eachCell((cell, columnNumber) => {
    const header = String(cell.value ?? "").trim();
    if (header) {
      columns.set(header, columnNumber);
    }
  });

  const missingHeaders = requiredHeaders.filter((header) => !columns.has(header));
  if (missingHeaders.length > 0) {
    throw new Error(
      `Workbook is missing required headers: ${missingHeaders.join(", ")}.`,
    );
  }

  const records: EmployeeImportRecord[] = [];
  const errors: string[] = [];
  const employeeNumbers = new Set<string>();
  let numericPhoneCount = 0;
  let longNumericStudentIdCount = 0;

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const hasData = requiredHeaders.some((header) => {
      const column = columns.get(header);
      return column !== undefined && row.getCell(column).value !== null;
    });
    if (!hasData) {
      return;
    }

    try {
      const record = toRecord(row, columns, rawNumericValues);
      if (employeeNumbers.has(record.employeeNumber)) {
        throw new Error(`Duplicate employee number at worksheet row ${rowNumber}.`);
      }
      employeeNumbers.add(record.employeeNumber);

      const studentIdColumn = columns.get("Nomor Induk Siswa/Mahasiswa");
      const phoneColumn = columns.get("No Telp/WA");
      const studentIdCell = row.getCell(studentIdColumn!);
      const phoneCell = row.getCell(phoneColumn!);

      if (typeof phoneCell.value === "number") {
        numericPhoneCount += 1;
      }
      if (
        typeof studentIdCell.value === "number" &&
        record.studentId &&
        record.studentId.length > 15
      ) {
        longNumericStudentIdCount += 1;
      }

      records.push(record);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid row data.";
      errors.push(message);
    }
  });

  if (errors.length > 0) {
    process.stderr.write(
      `Import stopped: ${errors.length} invalid row(s). ${errors.join(" ")}\n`,
    );
    process.exitCode = 1;
    return;
  }

  for (const record of records) {
    const employee = new EmployeeModel(record);
    try {
      await employee.validate();
    } catch (error) {
      const fields =
        error instanceof mongoose.Error.ValidationError
          ? Object.keys(error.errors).join(", ")
          : "schema";
      errors.push(`Validation failed for worksheet data (${fields}).`);
    }
  }

  if (errors.length > 0) {
    process.stderr.write(
      `Import stopped: ${errors.length} record(s) failed model validation. ${errors.join(" ")}\n`,
    );
    process.exitCode = 1;
    return;
  }

  const uri = process.env.MONGODB_URL?.trim();
  const dbName = process.env.MONGODB_DB?.trim();
  if (!uri || !dbName) {
    throw new Error("MONGODB_URL and MONGODB_DB must be set in the environment.");
  }

  await mongoose.connect(uri, { dbName });
  try {
    const existingEmployeeNumbers = new Set(
      await EmployeeModel.find({
        employeeNumber: { $in: records.map((record) => record.employeeNumber) },
      })
        .distinct("employeeNumber")
        .exec(),
    );
    const newRecords = records.filter(
      (record) => !existingEmployeeNumbers.has(record.employeeNumber),
    );

    process.stdout.write(
      `Workbook validated: ${records.length} record(s); ${newRecords.length} new; ${existingEmployeeNumbers.size} already exist and will be skipped.\n`,
    );
    if (numericPhoneCount > 0) {
      process.stdout.write(
        `Data note: ${numericPhoneCount} phone value(s) are stored as numbers in Excel; the import preserves the saved digits, but cannot restore any leading zero already removed by Excel.\n`,
      );
    }
    if (longNumericStudentIdCount > 0) {
      process.stdout.write(
        `Data note: ${longNumericStudentIdCount} numeric student ID value(s) exceed 15 digits; Excel may have rounded them before this import.\n`,
      );
    }

    if (!shouldApply) {
      process.stdout.write(
        "Dry run only; no records were written. Re-run with --apply to insert new records.\n",
      );
      return;
    }

    let insertedCount = 0;
    let skippedCount = existingEmployeeNumbers.size;
    for (const record of newRecords) {
      try {
        const result = await EmployeeModel.updateOne(
          { employeeNumber: record.employeeNumber },
          { $setOnInsert: record },
          { upsert: true, runValidators: true },
        ).exec();
        if (result.upsertedCount > 0) {
          insertedCount += 1;
        } else {
          skippedCount += 1;
        }
      } catch (error) {
        if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
          skippedCount += 1;
          continue;
        }
        throw error;
      }
    }

    process.stdout.write(
      `Import complete: ${insertedCount} inserted; ${skippedCount} skipped. Existing records were not overwritten.\n`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Employee import failed.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
