"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import type { Session } from "next-auth";
import { signOutUser } from "@/app/employees/actions";
import { WorkspaceNavigation } from "@/app/employees/workspace-navigation";

const roleLabels = {
  super_admin: "Super Admin",
  admin: "Admin",
  hr: "HR",
  manager: "Manager",
} as const;

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/mpp"
      onClick={onClick}
      className="flex min-w-0 items-center gap-3"
      aria-label="COXYRA ENTERPRISE SYSTEM beranda"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white lg:size-10">
        C
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold tracking-wide text-white">
          COXYRA
        </span>
        <span className="hidden text-[10px] font-semibold tracking-[0.18em] text-slate-400 sm:block">
          ENTERPRISE SYSTEM
        </span>
      </span>
    </Link>
  );
}

function UserSummary({ user }: { user: Session["user"] }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-slate-200"
      >
        {(user.name ?? user.email ?? "U").slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">
          {user.name ?? user.email ?? "Pengguna"}
        </p>
        <p className="text-xs text-slate-400">{roleLabels[user.role]}</p>
      </div>
    </div>
  );
}

function SignOutButton() {
  return (
    <form action={signOutUser}>
      <button
        type="submit"
        className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Keluar
      </button>
    </form>
  );
}

export function WorkspaceSidebar({ user }: { user: Session["user"] }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = Array.from(
          panelRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled])',
          ) ?? [],
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements.at(-1);
        const activeElement = document.activeElement;

        if (event.shiftKey && activeElement === firstElement && lastElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (
          !event.shiftKey &&
          (activeElement === lastElement ||
            !panelRef.current?.contains(activeElement))
        ) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      menuButton?.focus();
    };
  }, [isMobileOpen]);

  return (
    <>
      <aside className="hidden bg-slate-950 text-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-64 lg:flex-col">
        <div className="px-5 py-5">
          <Brand />
        </div>
        <Suspense
          fallback={
            <nav
              aria-label="Navigasi utama"
              className="px-4 pb-4 text-sm text-slate-400"
            >
              Memuat navigasi...
            </nav>
          }
        >
          <WorkspaceNavigation idPrefix="desktop" />
        </Suspense>
        <div className="mt-auto space-y-3 border-t border-slate-800 p-4">
          <UserSummary user={user} />
          <SignOutButton />
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-slate-950 px-4 py-3 text-white shadow-sm lg:hidden">
        <Brand />
        <div className="flex min-w-0 items-center gap-3">
          <span className="max-w-28 truncate text-xs text-slate-300">
            {user.name ?? user.email ?? "Pengguna"}
          </span>
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={isMobileOpen ? "Tutup navigasi" : "Buka navigasi"}
            aria-expanded={isMobileOpen}
            aria-controls="mobile-sidebar-panel"
            onClick={() => setIsMobileOpen((open) => !open)}
            className="flex size-10 shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg border border-slate-700 transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <span className="h-0.5 w-5 rounded-full bg-white" />
            <span className="h-0.5 w-5 rounded-full bg-white" />
            <span className="h-0.5 w-5 rounded-full bg-white" />
          </button>
        </div>
      </header>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup navigasi"
            onClick={() => setIsMobileOpen(false)}
            className="absolute inset-0 bg-slate-950/60"
          />
          <aside
            ref={panelRef}
            id="mobile-sidebar-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Navigasi COXYRA"
            className="absolute inset-y-0 left-0 z-10 flex w-72 max-w-[85vw] flex-col bg-slate-950 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
              <Brand onClick={() => setIsMobileOpen(false)} />
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Tutup navigasi"
                onClick={() => setIsMobileOpen(false)}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 text-xl text-slate-200 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pt-2">
              <Suspense
                fallback={
                  <nav
                    aria-label="Navigasi utama"
                    className="px-4 pb-4 text-sm text-slate-400"
                  >
                    Memuat navigasi...
                  </nav>
                }
              >
                <WorkspaceNavigation
                  idPrefix="mobile"
                  onNavigate={() => setIsMobileOpen(false)}
                />
              </Suspense>
            </div>
            <div className="space-y-3 border-t border-slate-800 p-4">
              <UserSummary user={user} />
              <SignOutButton />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
