import { Suspense } from "react";
import Link from "next/link";
import { ContractFollowUpForm } from "@/app/employees/[employeeId]/contract/contract-follow-up-form";
import { EmployeeWorkspace } from "@/app/employees/employee-workspace";
import { requireUser } from "@/lib/authorization";
import { employmentTypeLabels } from "@/lib/employment-types";
import { getEmployeeById } from "@/lib/employees";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

async function ContractFollowUpContent({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const user = await requireUser(["admin", "hr"]);
  const { employeeId } = await params;
  const employee = await getEmployeeById(employeeId);

  return (
    <EmployeeWorkspace
      user={user}
      title="Tindak lanjut kontrak"
      description="Catat perpanjangan atau penyelesaian kontrak karyawan."
    >
      <section className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <Link
          href={`/employees/${employee.id}`}
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          Kembali ke profil karyawan
        </Link>
        <div className="mt-4 border-b border-slate-100 pb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            {employee.fullName}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {employee.employeeNumber} · {employee.position} ·{" "}
            {employee.department}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Jenis hubungan kerja:{" "}
            <span className="font-semibold text-slate-900">
              {employmentTypeLabels[employee.employmentType]}
            </span>
          </p>
        </div>
        {employee.employmentStatus === "active" &&
        employee.contractEndDate ? (
          <>
            <p className="mt-4 text-sm text-slate-600">
              Akhir kontrak saat ini:{" "}
              <span className="font-semibold text-slate-900">
                {formatDate(employee.contractEndDate)}
              </span>
            </p>
            <div className="mt-5">
              <ContractFollowUpForm
                employeeId={employee.id}
                currentEndDate={employee.contractEndDate}
                startDate={employee.startDate}
              />
            </div>
          </>
        ) : (
          <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-800">
              Tindak lanjut kontrak tidak tersedia.
            </p>
            <p className="mt-1">
              {employee.employmentStatus !== "active"
                ? "Karyawan ini sudah tidak berstatus aktif."
                : "Jenis hubungan kerja ini tidak memiliki tanggal akhir kontrak."}
            </p>
          </div>
        )}
      </section>
    </EmployeeWorkspace>
  );
}

export default function ContractFollowUpPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
          <p className="mx-auto max-w-4xl text-sm text-slate-600">
            Memuat tindak lanjut kontrak...
          </p>
        </main>
      }
    >
      <ContractFollowUpContent params={params} />
    </Suspense>
  );
}
