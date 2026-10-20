import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { WorkspaceSidebar } from "@/app/employees/workspace-sidebar";

export function EmployeeWorkspace({
  user,
  title,
  description,
  children,
}: {
  user: Session["user"];
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <WorkspaceSidebar user={user} />

      <div className="min-h-screen min-w-0 flex-1 lg:ml-64">
        <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <div className="min-w-0">
            <h1 className="mt-1 truncate text-xl font-semibold text-slate-900">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
