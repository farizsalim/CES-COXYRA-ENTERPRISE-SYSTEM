import { Suspense } from "react";
import Link from "next/link";
import { EmployeeCreateForm } from "@/app/employees/employee-create-form";
import { EmployeeWorkspace } from "@/app/employees/employee-workspace";
import { requireUser } from "@/lib/authorization";
import { getEmployeeById } from "@/lib/employees";

async function EditEmployeeContent({
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
      title="Ubah data karyawan"
      description="Perbarui informasi kerja dan data profil yang berwenang Anda kelola."
    >
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <Link
          href="/employees"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          Kembali ke direktori
        </Link>
        <h1 className="mb-5 mt-4 text-2xl font-semibold text-slate-900">
          Ubah data karyawan
        </h1>
        <EmployeeCreateForm
          employee={employee}
          canManagePrivateData={user.role === "super_admin" || user.role === "hr"}
        />
      </section>
    </EmployeeWorkspace>
  );
}

export default function EditEmployeePage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
          <p className="mx-auto max-w-3xl text-sm text-slate-600">
            Memuat data karyawan...
          </p>
        </main>
      }
    >
      <EditEmployeeContent params={params} />
    </Suspense>
  );
}
