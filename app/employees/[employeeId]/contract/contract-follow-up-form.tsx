"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { followUpContract } from "@/app/employees/actions";
import { initialEmployeeActionState } from "@/lib/employee-action-state";
import {
  employmentTypeOptions,
  type SelectableEmploymentType,
} from "@/lib/employment-types";

export function ContractFollowUpForm({
  employeeId,
  currentEndDate,
  startDate,
}: {
  employeeId: string;
  currentEndDate: string;
  startDate: string;
}) {
  const [state, formAction, pending] = useActionState(
    followUpContract,
    initialEmployeeActionState,
  );
  const [employmentType, setEmploymentType] = useState<
    SelectableEmploymentType | ""
  >("");
  const isPermanent = employmentType === "permanent";
  const minRenewalEndDate = new Date(
    new Date(`${currentEndDate}T00:00:00.000Z`).getTime() + 86_400_000,
  )
    .toISOString()
    .slice(0, 10);

  return (
    <div className="space-y-5">
      {state.message && (
        <p
          role="status"
          className={`rounded-lg px-4 py-3 text-sm ${
            state.success
              ? "bg-emerald-50 text-emerald-800"
              : "bg-rose-50 text-rose-800"
          }`}
        >
          {state.message}
          {state.success && (
            <>
              {" "}
              <Link
                href={`/employees/${employeeId}`}
                className="font-semibold underline"
              >
                Kembali ke profil
              </Link>
            </>
          )}
        </p>
      )}

      <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 sm:p-5">
        <h2 className="text-base font-semibold text-slate-900">
          Perpanjang kontrak
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Tanggal akhir sebelumnya akan disimpan sebagai riwayat.
        </p>
        <form action={formAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="employeeId" value={employeeId} />
          <input type="hidden" name="contractAction" value="extended" />
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Jenis hubungan kerja berikutnya
            <select
              name="employmentType"
              value={employmentType}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setEmploymentType(
                  employmentTypeOptions.find(
                    (option) => option.value === value,
                  )?.value ?? "",
                );
              }}
              required
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="" disabled>
                Pilih jenis hubungan kerja
              </option>
              {employmentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {!isPermanent ? (
            <>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Tanggal akhir baru
                <input
                  name="newEndDate"
                  type="date"
                  min={minRenewalEndDate}
                  required
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Durasi kontrak berikutnya (bulan)
                <input
                  name="contractDurationMonths"
                  type="number"
                  min={1}
                  max={1200}
                  step={1}
                  required
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </>
          ) : (
            <p className="self-end text-sm text-slate-600">
              Karyawan Tetap tidak memakai tanggal akhir atau durasi kontrak.
            </p>
          )}
          <label className="grid gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
            Alasan perpanjangan
            <textarea
              name="reason"
              maxLength={500}
              required
              rows={3}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="w-fit rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
          >
            {pending
              ? "Menyimpan..."
              : isPermanent
                ? "Ubah menjadi Tetap"
                : "Simpan perpanjangan"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="text-base font-semibold text-slate-900">
          Tandai kontrak selesai
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Status karyawan akan berubah menjadi Selesai. Tanggal akhir aktual
          dan alasan akan tersimpan di riwayat kontrak.
        </p>
        <form action={formAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="employeeId" value={employeeId} />
          <input type="hidden" name="contractAction" value="completed" />
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Tanggal akhir aktual
            <input
              name="newEndDate"
              type="date"
              min={startDate}
              required
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
            Alasan kontrak selesai
            <textarea
              name="reason"
              maxLength={500}
              required
              rows={3}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="w-fit rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Menyimpan..." : "Simpan sebagai selesai"}
          </button>
        </form>
      </section>
    </div>
  );
}
