import { Suspense } from "react";
import Link from "next/link";
import { EmployeeCreateForm } from "@/app/employees/employee-create-form";
import { EmployeeWorkspace } from "@/app/employees/employee-workspace";
import { requireUser } from "@/lib/authorization";

async function NewEmployeeContent() {
  const user = await requireUser(["admin", "hr"]);

  return (
    <EmployeeWorkspace
      user={user}
      title="Tambah karyawan"
      description="Lengkapi data kerja dan profil karyawan baru."
    >
      <section className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <Link
          href="/employees"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          Kembali ke daftar karyawan
        </Link>
        <h2 className="mb-1 mt-4 text-xl font-semibold text-slate-900">
          Data karyawan baru
        </h2>
        <p className="mb-5 text-sm text-slate-500">
          Isi informasi kerja. Data pribadi hanya tersedia untuk HR dan Super
          Admin.
        </p>
        <EmployeeCreateForm
          canManagePrivateData={user.role === "super_admin" || user.role === "hr"}
        />
      </section>
    </EmployeeWorkspace>
  );
}

export default function NewEmployeePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
          <p className="mx-auto max-w-4xl text-sm text-slate-600">
            Memuat formulir karyawan...
          </p>
        </main>
      }
    >
      <NewEmployeeContent />
    </Suspense>
  );
}
