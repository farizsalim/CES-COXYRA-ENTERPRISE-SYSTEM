import { Suspense } from "react";
import Link from "next/link";
import { EmployeeWorkspace } from "@/app/employees/employee-workspace";
import { employmentTypeLabels } from "@/lib/employment-types";
import { requireUser } from "@/lib/authorization";
import {
  getEmployeeDashboardStats,
  getEmployees,
  employeePageSizes,
  type EmployeeListView,
  type EmployeeSummary,
} from "@/lib/employees";

const employmentStatusLabels = {
  active: "Aktif",
  on_leave: "Cuti",
  ended: "Berakhir",
  resigned: "Resign",
  completed: "Selesai",
} as const;

const views: Array<{ value: EmployeeListView; label: string }> = [
  { value: "active", label: "Aktif" },
  { value: "ending-soon", label: "Berakhir ≤14 hari" },
  { value: "all", label: "Semua" },
];

function getView(value?: string): EmployeeListView {
  return views.find((view) => view.value === value)?.value ?? "active";
}

function getPageNumber(value?: string): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function getPaginationItems(
  currentPage: number,
  pageCount: number,
): Array<number | "start-ellipsis" | "end-ellipsis"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "end-ellipsis", pageCount];
  }
  if (currentPage >= pageCount - 3) {
    return [
      1,
      "start-ellipsis",
      pageCount - 4,
      pageCount - 3,
      pageCount - 2,
      pageCount - 1,
      pageCount,
    ];
  }
  return [
    1,
    "start-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-ellipsis",
    pageCount,
  ];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function getStatusStyle(status: EmployeeSummary["employmentStatus"]): string {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }
  if (status === "on_leave") {
    return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }
  return "bg-slate-100 text-slate-600 ring-slate-500/20";
}

async function EmployeesContent({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    view?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const user = await requireUser();
  const {
    q = "",
    view: rawView,
    page: rawPage,
    pageSize: rawPageSize,
  } = await searchParams;
  const view = getView(rawView);
  const page = getPageNumber(rawPage);
  const pageSize =
    employeePageSizes.find((size) => String(size) === rawPageSize) ?? 10;
  const [employeeResult, stats] = await Promise.all([
    getEmployees(q, view, page, pageSize),
    getEmployeeDashboardStats(),
  ]);
  const { employees, total, currentPage, pageCount } = employeeResult;
  const canManageEmployees =
    user.role === "super_admin" || user.role === "admin" || user.role === "hr";
  const pageUrl = (nextPage: number, nextView = view) => {
    const params = new URLSearchParams({
      view: nextView,
      pageSize: String(pageSize),
    });
    if (q) {
      params.set("q", q);
    }
    if (nextPage > 1) {
      params.set("page", String(nextPage));
    }
    return `/employees?${params.toString()}`;
  };
  const exportParams = new URLSearchParams({ view });
  if (q) {
    exportParams.set("q", q);
  }
  const exportUrl = `/employees/export?${exportParams.toString()}`;
  const filterUrl = (nextView: EmployeeListView) => pageUrl(1, nextView);
  const firstItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, total);
  const paginationItems = getPaginationItems(currentPage, pageCount);

  return (
    <EmployeeWorkspace
      user={user}
      title="Daftar karyawan"
      description="Pantau status karyawan dan masa kerja dalam satu tempat."
    >
      <section aria-label="Statistik karyawan" className="grid gap-4 sm:grid-cols-2">
        <Link
          href={filterUrl("active")}
          className="rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm font-medium text-slate-500">Karyawan aktif</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-2xl font-semibold tracking-tight text-slate-900">
              {stats.activeCount}
            </p>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              Sedang bekerja
            </span>
          </div>
        </Link>

        <Link
          href={filterUrl("ending-soon")}
          className="rounded-xl border border-amber-200 border-l-4 border-l-amber-500 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm font-medium text-slate-500">
            Masa kerja berakhir dalam 14 hari
          </p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-2xl font-semibold tracking-tight text-slate-900">
              {stats.endingSoonCount}
            </p>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
              Pengingat H-14
            </span>
          </div>
        </Link>
      </section>

      <details className="group rounded-xl border border-amber-200 bg-amber-50/60">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
          <span>
            <span className="block text-sm font-semibold text-slate-900">
              Perlu perhatian
            </span>
            <span className="mt-0.5 block text-sm text-slate-600">
              {stats.endingSoonCount > 0
                ? `${stats.endingSoonCount} karyawan aktif mendekati akhir masa kerja`
                : "Tidak ada kontrak yang berakhir dalam 14 hari ke depan"}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
              {stats.endingSoonCount}
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className="size-4 text-amber-900 transition group-open:rotate-180"
            >
              <path
                d="m5 7.5 5 5 5-5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </summary>
        {stats.endingSoonEmployees.length > 0 && (
          <ul className="divide-y divide-amber-200/70 border-t border-amber-200 px-4">
            {stats.endingSoonEmployees.map((employee) => (
              <li
                key={employee.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <Link
                    href={`/employees/${employee.id}`}
                    className="text-sm font-medium text-slate-900 hover:text-blue-700 hover:underline"
                  >
                    {employee.fullName}
                  </Link>
                  <p className="text-xs text-slate-600">
                    {employee.employeeNumber} · {employee.position} ·{" "}
                    {employee.department}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold text-amber-900">
                    {employee.daysRemaining === 0
                      ? "Berakhir hari ini"
                      : `Sisa ${employee.daysRemaining} hari`}
                  </p>
                  {canManageEmployees && (
                    <Link
                      href={`/employees/${employee.id}/contract`}
                      className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
                    >
                      Tindak lanjut
                    </Link>
                  )}
                </div>
              </li>
            ))}
            {stats.endingSoonCount > stats.endingSoonEmployees.length && (
              <li className="py-3 text-sm text-slate-600">
                Dan {stats.endingSoonCount - stats.endingSoonEmployees.length}{" "}
                karyawan lainnya masuk rentang pengingat.
              </li>
            )}
          </ul>
        )}
        <div className="border-t border-amber-200 px-4 py-3">
          <Link
            href={filterUrl("ending-soon")}
            className="text-sm font-semibold text-amber-900 hover:underline"
          >
            Lihat daftar H-14
          </Link>
        </div>
      </details>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Daftar karyawan
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Menampilkan {firstItem}–{lastItem} dari {total} karyawan.
              </p>
            </div>
            {canManageEmployees && (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={exportUrl}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  Ekspor Excel
                </Link>
                <Link
                  href="/employees/new"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  + Tambah karyawan
                </Link>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <nav
              aria-label="Filter daftar karyawan"
              className="flex gap-1 overflow-x-auto"
            >
              {views.map((item) => (
                <Link
                  key={item.value}
                  href={filterUrl(item.value)}
                  aria-current={view === item.value ? "page" : undefined}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
                    view === item.value
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <form
              action="/employees"
              className="flex w-full flex-wrap items-center gap-2 lg:w-auto"
            >
              <input type="hidden" name="view" value={view} />
              <label
                htmlFor="employee-page-size"
                className="flex shrink-0 items-center gap-2 text-sm text-slate-600"
              >
                Tampilkan
                <select
                  id="employee-page-size"
                  name="pageSize"
                  defaultValue={String(pageSize)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {employeePageSizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor="employee-search" className="sr-only">
                Cari karyawan
              </label>
              <input
                id="employee-search"
                name="q"
                defaultValue={q}
                placeholder="Cari nama, nomor, divisi"
                maxLength={100}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 lg:w-64 lg:flex-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                Terapkan
              </button>
            </form>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr className="border-y border-slate-200 text-slate-500">
                <th className="px-5 py-3 font-medium">Karyawan</th>
                <th className="px-5 py-3 font-medium">Divisi / Posisi</th>
                <th className="px-5 py-3 font-medium">Hubungan kerja</th>
                <th className="px-5 py-3 font-medium">Akhir masa kerja</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((employee) => (
                <tr key={employee.id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/employees/${employee.id}`}
                      className="font-medium text-slate-900 hover:text-blue-700 hover:underline"
                    >
                      {employee.fullName}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {employee.employeeNumber}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-slate-800">{employee.department}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {employee.position}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">
                    {employmentTypeLabels[employee.employmentType]}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">
                    {employee.contractEndDate
                      ? formatDate(employee.contractEndDate)
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusStyle(employee.employmentStatus)}`}
                    >
                      {employmentStatusLabels[employee.employmentStatus]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-3">
                      <Link
                        href={`/employees/${employee.id}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        Detail
                      </Link>
                      {canManageEmployees && (
                        <Link
                          href={`/employees/${employee.id}/edit`}
                          className="font-medium text-slate-600 hover:text-slate-900 hover:underline"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <p className="font-medium text-slate-700">
                      {q
                        ? "Tidak ada karyawan yang cocok dengan pencarian."
                        : view === "ending-soon"
                          ? "Tidak ada kontrak aktif yang berakhir dalam 14 hari."
                          : view === "active"
                            ? "Belum ada karyawan aktif."
                            : "Belum ada data karyawan."}
                    </p>
                    {q && (
                      <Link
                        href={filterUrl(view)}
                        className="mt-2 inline-block text-sm font-medium text-blue-700 hover:underline"
                      >
                        Hapus pencarian
                      </Link>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:px-5">
          <p className="text-sm text-slate-500">
            Menampilkan {firstItem}–{lastItem} dari {total} data
          </p>
          {pageCount > 1 && (
            <nav
              aria-label="Navigasi halaman daftar karyawan"
              className="flex items-center gap-1"
            >
              {currentPage > 1 ? (
                <Link
                  href={pageUrl(currentPage - 1)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Sebelumnya
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="cursor-not-allowed rounded-lg px-3 py-2 text-sm font-medium text-slate-300"
                >
                  Sebelumnya
                </span>
              )}
              {paginationItems.map((item) =>
                typeof item === "number" ? (
                  <Link
                    key={item}
                    href={pageUrl(item)}
                    aria-current={item === currentPage ? "page" : undefined}
                    className={`min-w-9 rounded-lg px-3 py-2 text-center text-sm font-medium ${
                      item === currentPage
                        ? "bg-blue-700 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {item}
                  </Link>
                ) : (
                  <span
                    key={item}
                    aria-hidden="true"
                    className="px-1 text-sm text-slate-400"
                  >
                    …
                  </span>
                ),
              )}
              {currentPage < pageCount ? (
                <Link
                  href={pageUrl(currentPage + 1)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Berikutnya
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="cursor-not-allowed rounded-lg px-3 py-2 text-sm font-medium text-slate-300"
                >
                  Berikutnya
                </span>
              )}
            </nav>
          )}
        </div>
      </section>
    </EmployeeWorkspace>
  );
}

export default function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    view?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-4 py-8">
          <p className="mx-auto max-w-7xl text-sm text-slate-600">
            Memuat ringkasan karyawan...
          </p>
        </main>
      }
    >
      <EmployeesContent searchParams={searchParams} />
    </Suspense>
  );
}
