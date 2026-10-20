import ExcelJS from "exceljs";
import {
  getEmployeesForExport,
  type EmployeeListView,
} from "@/lib/employees";
import {
  employmentTypeLabels,
} from "@/lib/employment-types";

const employmentStatusLabels = {
  active: "Aktif",
  on_leave: "Cuti",
  ended: "Berakhir",
  resigned: "Resign",
  completed: "Selesai",
} as const;

function getView(value: string | null): EmployeeListView {
  return value === "all" || value === "ending-soon" ? value : "active";
}

function excelDate(value?: string): Date | "" {
  return value ? new Date(`${value}T00:00:00.000Z`) : "";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const view = getView(url.searchParams.get("view"));
  const searchTerm = url.searchParams.get("q") ?? "";
  const { employees, includePrivateData } = await getEmployeesForExport(
    searchTerm,
    view,
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "COXYRA ENTERPRISE SYSTEM";
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet("Daftar Karyawan");
  const columns: Array<{ header: string; key: string; width: number }> = [
    { header: "Nomor Karyawan", key: "employeeNumber", width: 18 },
    { header: "Nama Lengkap", key: "fullName", width: 28 },
    { header: "Email Kerja", key: "workEmail", width: 28 },
    { header: "Departemen", key: "department", width: 22 },
    { header: "Jabatan", key: "position", width: 24 },
    { header: "Level", key: "level", width: 18 },
    { header: "Tipe Hubungan Kerja", key: "employmentType", width: 22 },
    { header: "Status", key: "employmentStatus", width: 16 },
    { header: "Tanggal Mulai", key: "startDate", width: 18 },
    { header: "Tanggal Akhir Kontrak", key: "contractEndDate", width: 22 },
    {
      header: "Durasi Kontrak (bulan)",
      key: "contractDurationMonths",
      width: 23,
    },
  ];

  if (includePrivateData) {
    columns.push(
      { header: "Tanggal Lahir", key: "dateOfBirth", width: 18 },
      { header: "Tempat Lahir", key: "birthPlace", width: 22 },
      { header: "Domisili", key: "domicile", width: 24 },
      {
        header: "Instansi Pendidikan",
        key: "educationInstitution",
        width: 28,
      },
      { header: "Jurusan", key: "major", width: 22 },
      { header: "Nomor Induk Siswa/Mahasiswa", key: "studentId", width: 30 },
      { header: "Telepon/WhatsApp", key: "phone", width: 22 },
      { header: "Username Media Sosial", key: "socialMediaUsername", width: 26 },
    );
  }

  worksheet.columns = columns;
  worksheet.addRows(
    employees.map((employee) => ({
      employeeNumber: employee.employeeNumber,
      fullName: employee.fullName,
      workEmail: employee.workEmail,
      department: employee.department,
      position: employee.position,
      level: employee.level,
      employmentType: employmentTypeLabels[employee.employmentType],
      employmentStatus: employmentStatusLabels[employee.employmentStatus],
      startDate: excelDate(employee.startDate),
      contractEndDate: excelDate(employee.contractEndDate),
      contractDurationMonths: employee.contractDurationMonths ?? "",
      dateOfBirth: excelDate(employee.dateOfBirth),
      birthPlace: employee.birthPlace ?? "",
      domicile: employee.domicile ?? "",
      educationInstitution: employee.educationInstitution ?? "",
      major: employee.major ?? "",
      studentId: employee.studentId ?? "",
      phone: employee.phone ?? "",
      socialMediaUsername: employee.socialMediaUsername ?? "",
    })),
  );
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1D4ED8" },
  };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };
  worksheet.getColumn("startDate").numFmt = "dd mmm yyyy";
  worksheet.getColumn("contractEndDate").numFmt = "dd mmm yyyy";
  if (includePrivateData) {
    worksheet.getColumn("dateOfBirth").numFmt = "dd mmm yyyy";
  }

  const file = await workbook.xlsx.writeBuffer();
  const fileName = `daftar-karyawan-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
