"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginActionState = {
  message: string;
};

export async function authenticate(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { message: "Masukkan email dan kata sandi." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/employees",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Email atau kata sandi tidak valid." };
    }

    throw error;
  }

  return { message: "" };
}
