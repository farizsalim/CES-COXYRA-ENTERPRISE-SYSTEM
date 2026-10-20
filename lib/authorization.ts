import "server-only";

import { auth } from "@/auth";
import type { UserRole } from "@/models/user";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export async function requireUser(allowedRoles?: readonly UserRole[]) {
  await connection();
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    session.user.role !== "super_admin" &&
    allowedRoles &&
    !allowedRoles.includes(session.user.role)
  ) {
    redirect("/employees");
  }

  return session.user;
}
