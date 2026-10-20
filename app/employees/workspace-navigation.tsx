"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function WorkspaceNavigation({
  idPrefix,
  onNavigate,
}: {
  idPrefix: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [isMppExpanded, setIsMppExpanded] = useState(() =>
    pathname.startsWith("/employees"),
  );
  const isMppHome = pathname === "/mpp";
  const isEmployeeSection = pathname.startsWith("/employees");
  const submenuId = `${idPrefix}-mpp-submenu`;

  return (
    <nav
      aria-label="Navigasi utama"
      className="px-4 pb-3 lg:flex-1"
    >
      <p className="hidden px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 lg:block">
        Manajemen SDM
      </p>
      <div className="relative lg:w-56">
        <div className="flex items-stretch gap-1">
          <Link
            href="/mpp"
            onClick={onNavigate}
            aria-current={isMppHome ? "page" : undefined}
            className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-semibold transition ${
              isMppHome || isEmployeeSection
                ? "border-blue-400 bg-slate-800 text-white"
                : "border-transparent text-slate-300 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className={`size-5 ${
                isMppHome || isEmployeeSection
                  ? "text-blue-300"
                  : "text-slate-500"
              }`}
            >
              <path
                d="M4 5.5h6l2 2h8v11H4v-13Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 9h16"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
            Manpower Planning
          </Link>
          <button
            type="button"
            aria-label={
              isMppExpanded
                ? "Tutup submenu Manpower Planning"
                : "Buka submenu Manpower Planning"
            }
            aria-expanded={isMppExpanded}
            aria-controls={submenuId}
            onClick={() => setIsMppExpanded((expanded) => !expanded)}
            className="flex items-center rounded-lg px-3 text-slate-300 transition hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className={`size-4 transition ${isMppExpanded ? "rotate-180" : ""}`}
            >
              <path
                d="m5 7.5 5 5 5-5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        {isMppExpanded && (
          <div
            id={submenuId}
            className="mt-1 rounded-lg border border-slate-700 bg-slate-900 p-1 shadow-lg lg:ml-5 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
          >
            <Link
              href="/employees"
              onClick={onNavigate}
              aria-current={isEmployeeSection ? "page" : undefined}
              className={`flex items-center rounded-lg border-l-2 px-3 py-2 text-sm font-medium ${
                isEmployeeSection
                  ? "border-blue-400 bg-slate-800 text-white"
                  : "border-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              Daftar karyawan
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}