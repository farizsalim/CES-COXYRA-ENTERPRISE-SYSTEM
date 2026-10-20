import { Suspense } from "react";
import Link from "next/link";
import { EmployeeWorkspace } from "@/app/employees/employee-workspace";
import { employmentTypeLabels } from "@/lib/employment-types";
import { requireUser } from "@/lib/authorization";
import { getEmployeeById } from "@/lib/employees";

const employmentStatusLabels = {
  active: "Aktif",
  on_leave: "Cuti",
  ended: "Berakhir",
  resigned: "Resign",
  completed: "Selesai",
} as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

async function EmployeeDetails({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const user = await requireUser();
  const { employeeId } = await params;
  const employee = await getEmployeeById(employeeId);
  const canManageEmployee =
    user.role === "super_admin" || user.role === "admin" || user.role === "hr";
  const canViewPrivateData =
    user.role === "super_admin" || user.role === "hr";

  const rows = [
    ["Nomor karyawan", employee.employeeNumber],
    ["Nama lengkap", employee.fullName],
    ["Email kerja", employee.workEmail],
    ["Divisi", employee.department],
    ["Posisi", employee.position],
    ["Level", employee.level],
    ["Status kepegawaian", employmentTypeLabels[employee.employmentType]],
    ["Status", employmentStatusLabels[employee.employmentStatus]],
    ["Tanggal masuk/onboarding", employee.startDate],
    ["Tanggal berakhir", employee.contractEndDate],
    [
      "Durasi kontrak/magang",
      employee.contractDurationMonths === null
        ? ""
        : `${employee.contractDurationMonths} bulan`,
    ],
  ];

  const privateRows = [
    ["Tanggal lahir", employee.dateOfBirth],
    ["Tempat lahir", employee.birthPlace],
    ["Domisili", employee.domicile],
    ["Instansi pendidikan", employee.educationInstitution],
    ["Jurusan", employee.major],
    ["Nomor induk siswa/mahasiswa", employee.studentId],
    ["No. telepon/WhatsApp", employee.phone],
    ["Username media sosial", employee.socialMediaUsername],
  ];

  return (
    <EmployeeWorkspace
      user={user}
      title="Profil karyawan"
      description="Informasi kerja dan detail profil karyawan."
    >
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/employees"
              className="text-sm font-medium text-blue-700 hover:underline"
            >
              Kembali ke daftar karyawan
            </Link>
            <h1 className="mt-4 text-2xl font-semibold text-slate-900">
              Profil karyawan
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Informasi kerja{canViewPrivateData ? " dan pribadi" : ""}.
            </p>
          </div>
          {canManageEmployee && (
            <div className="flex flex-wrap gap-2">
              {employee.employmentStatus === "active" &&
                employee.contractEndDate && (
                  <Link
                    href={`/employees/${employee.id}/contract`}
                    className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                  >
                    Tindak lanjut kontrak
                  </Link>
                )}
              <Link
                href={`/employees/${employee.id}/edit`}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Ubah data
              </Link>
            </div>
          )}
        </div>

        <dl className="mt-6 grid gap-x-8 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="border-b border-slate-100 py-3"
            >
              <dt className="text-sm text-slate-500">{label}</dt>
              <dd className="mt-1 font-medium text-slate-900">{value || "—"}</dd>
            </div>
          ))}
        </dl>

        {canManageEmployee && (employee.contractHistory?.length ?? 0) > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">
              Riwayat tindak lanjut kontrak
            </h2>
            <ul className="mt-2 divide-y divide-slate-100">
              {employee.contractHistory?.map((record, index) => (
                <li
                  key={`${record.recordedAt}-${index}`}
                  className="py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">
                      {record.action === "extended"
                        ? "Kontrak diperpanjang"
                        : record.action === "converted"
                          ? "Jenis hubungan kerja diubah"
                          : "Kontrak selesai"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatDate(record.recordedAt.slice(0, 10))}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {employmentTypeLabels[record.previousEmploymentType]} →{" "}
                    {employmentTypeLabels[record.newEmploymentType]}
                    {" · "}
                    {formatDate(record.previousEndDate)} →{" "}
                    {record.newEndDate
                      ? formatDate(record.newEndDate)
                      : "Tanpa tanggal akhir"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Alasan: {record.reason}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {canViewPrivateData && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">
              Data pribadi
            </h2>
            <dl className="mt-2 grid gap-x-8 sm:grid-cols-2">
              {privateRows.map(([label, value]) => (
                <div
                  key={label}
                  className="border-b border-slate-100 py-3"
                >
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {value || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </section>
    </EmployeeWorkspace>
  );
}

export default function EmployeeDetailsPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
          <p className="mx-auto max-w-4xl text-sm text-slate-600">
            Memuat profil karyawan...
          </p>
        </main>
      }
    >
      <EmployeeDetails params={params} />
    </Suspense>
  );
}
