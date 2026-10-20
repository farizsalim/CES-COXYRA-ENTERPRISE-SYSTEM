"use client";

import { useActionState } from "react";
import { authenticate, type LoginActionState } from "@/app/login/actions";

const initialState: LoginActionState = { message: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(authenticate, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-1 text-sm font-medium">
        Email kerja
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Kata sandi
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {pending ? "Memeriksa..." : "Masuk"}
      </button>
      {state.message && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}
    </form>
  );
}
