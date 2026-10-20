"use client";

import { useActionState } from "react";
import { createEmployee, updateEmployee } from "@/app/employees/actions";
import { initialEmployeeActionState } from "@/lib/employee-action-state";
import {
  employmentTypeLabels,
  employmentTypeOptions,
} from "@/lib/employment-types";
import type { EmployeeSummary } from "@/lib/employees";

export function EmployeeCreateForm({
  employee,
  canManagePrivateData = true,
}: {
  employee?: EmployeeSummary;
  canManagePrivateData?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    employee ? updateEmployee : createEmployee,
    initialEmployeeActionState,
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {employee && (
        <input type="hidden" name="employeeId" value={employee.id} />
      )}
      <label className="grid gap-1 text-sm font-medium">
        Nomor karyawan
        <input
          name="employeeNumber"
          required
          maxLength={32}
          defaultValue={employee?.employeeNumber}
          readOnly={Boolean(employee)}
          className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Nama lengkap
        <input
          name="fullName"
          required
          maxLength={150}
          defaultValue={employee?.fullName}
          className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Email kerja
        <input
          name="workEmail"
          type="email"
          maxLength={254}
          defaultValue={employee?.workEmail}
          className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Departemen
        <input
          name="department"
          required
          maxLength={100}
          defaultValue={employee?.department}
          className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Jabatan
        <input
          name="position"
          required
          maxLength={100}
          defaultValue={employee?.position}
          className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Level
        <input
          name="level"
          maxLength={100}
          defaultValue={employee?.level}
          className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Tipe hubungan kerja
        <select
          name="employmentType"
          required
          defaultValue={employee?.employmentType ?? "pkwt"}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          {employee &&
            !employmentTypeOptions.some(
              (option) => option.value === employee.employmentType,
            ) && (
              <option value={employee.employmentType}>
                {employmentTypeLabels[employee.employmentType]}
              </option>
            )}
          {employmentTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Status
        <select
          name="employmentStatus"
          required
          defaultValue={employee?.employmentStatus ?? "active"}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="active">Aktif</option>
          <option value="on_leave">Cuti</option>
          <option value="ended">Berakhir</option>
          <option value="resigned">Resign</option>
          <option value="completed">Selesai</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Tanggal mulai
        <input
          name="startDate"
          type="date"
          required
          defaultValue={employee?.startDate}
          className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium sm:col-span-2">
        Tanggal akhir kontrak (wajib untuk kontrak/magang)
        <input
          name="contractEndDate"
          type="date"
          defaultValue={employee?.contractEndDate}
          className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Durasi kontrak/magang (bulan)
        <input
          name="contractDurationMonths"
          type="number"
          min={0}
          max={1200}
          step={1}
          defaultValue={employee?.contractDurationMonths ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>
      {canManagePrivateData && (
        <fieldset className="grid gap-4 border-t border-slate-200 pt-4 sm:col-span-2 sm:grid-cols-2">
          <legend className="px-1 text-base font-semibold text-slate-900">
            Data pribadi
          </legend>
        <label className="grid gap-1 text-sm font-medium">
          Tanggal lahir
          <input
            name="dateOfBirth"
            type="date"
            defaultValue={employee?.dateOfBirth}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Tempat lahir
          <input
            name="birthPlace"
            maxLength={150}
            defaultValue={employee?.birthPlace}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Domisili
          <input
            name="domicile"
            maxLength={150}
            defaultValue={employee?.domicile}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Instansi pendidikan
          <input
            name="educationInstitution"
            maxLength={200}
            defaultValue={employee?.educationInstitution}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Jurusan
          <input
            name="major"
            maxLength={150}
            defaultValue={employee?.major}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Nomor induk siswa/mahasiswa
          <input
            name="studentId"
            maxLength={64}
            defaultValue={employee?.studentId}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Nomor telepon/WhatsApp
          <input
            name="phone"
            type="tel"
            maxLength={32}
            defaultValue={employee?.phone}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Username media sosial
          <input
            name="socialMediaUsername"
            maxLength={150}
            defaultValue={employee?.socialMediaUsername}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        </fieldset>
      )}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {pending
            ? "Menyimpan..."
            : employee
              ? "Simpan perubahan"
              : "Tambah karyawan"}
        </button>
        {state.message && (
          <p
            role="status"
            className={`mt-3 text-sm ${state.success ? "text-green-700" : "text-red-700"}`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
