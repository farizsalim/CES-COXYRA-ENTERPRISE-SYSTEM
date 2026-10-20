import { Suspense } from "react";
import Link from "next/link";
import { EmployeeWorkspace } from "@/app/employees/employee-workspace";
import { requireUser } from "@/lib/authorization";

async function MppContent() {
  const user = await requireUser();

  return (
    <EmployeeWorkspace
      user={user}
      title="Manpower Planning"
      description="Perencanaan kebutuhan tenaga kerja dan rekrutmen."
    >
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
          Manpower Planning
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          Kelola data dan kebutuhan tenaga kerja
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Daftar karyawan tersedia di bagian ini. Pengajuan kebutuhan tenaga
          kerja dan proses rekrutmen akan ditambahkan sebagai tahapan MPP
          berikutnya.
        </p>
        <Link
          href="/employees"
          className="mt-5 inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          Buka daftar karyawan
        </Link>
      </section>
    </EmployeeWorkspace>
  );
}

export default function MppPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
          <p className="mx-auto max-w-4xl text-sm text-slate-600">
            Memuat modul MPP...
          </p>
        </main>
      }
    >
      <MppContent />
    </Suspense>
  );
}