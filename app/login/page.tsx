import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { LoginForm } from "@/app/login/login-form";

async function LoginContent() {
  await connection();
  const session = await auth();
  if (session?.user) {
    redirect("/employees");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          COXYRA ENTERPRISE SYSTEM
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Masuk ke HRIS</h1>
        <p className="mt-2 text-sm text-slate-600">
          Gunakan akun internal yang telah dibuat oleh administrator.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
          <p className="text-sm text-slate-600">Memuat halaman masuk...</p>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
