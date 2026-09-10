"use client";

import { cn } from "@/lib/utils";
import {
  BookOpen,
  CalendarDays,
  FileText,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  ListTodo,
  Menu,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CommandPalette } from "./command-palette";
import { DataSync } from "./data-sync";
import { useAppStore } from "@/lib/store";

const nav = [
  {
    label: "Workspace",
    items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/applications", label: "Applications", icon: GraduationCap },
      { href: "/professors", label: "Professors", icon: Users },
    ],
  },
  {
    label: "Research",
    items: [{ href: "/research", label: "Research", icon: BookOpen }],
  },
  {
    label: "Planning",
    items: [
      { href: "/tasks", label: "Tasks", icon: ListTodo },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/timeline", label: "Timeline", icon: GitBranch },
    ],
  },
  {
    label: "Resources",
    items: [{ href: "/documents", label: "Documents", icon: FileText }],
  },
  {
    label: "System",
    items: [
      { href: "/search", label: "Search", icon: Search },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function NavLink({
  href,
  label,
  icon: Icon,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-2 rounded-[var(--radius)] px-2 py-1.5 text-[13px] transition-colors",
        active
          ? "bg-accent-soft font-medium text-accent"
          : "text-ink-secondary hover:bg-bg-hover hover:text-ink",
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", active ? "text-accent" : "text-ink-faint")} />
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const hydrated = useAppStore((s) => s.hydrated);
  const setHydrated = useAppStore((s) => s.setHydrated);
  const cycle = useAppStore((s) => s.settings.cycle);

  useEffect(() => {
    // Ensure UI unlocks even if persist rehydration is slow
    const t = window.setTimeout(() => setHydrated(true), 50);
    return () => window.clearTimeout(t);
  }, [setHydrated]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[var(--sidebar-width)] shrink-0 flex-col border-r border-border bg-bg-elevated lg:flex">
          <div className="border-b border-border px-4 py-4">
            <Link href="/" className="block">
              <div className="font-serif text-[22px] leading-none tracking-tight text-ink">
                PH.D. OS
              </div>
              <div className="mt-1 text-[11px] text-ink-muted">{cycle} season</div>
            </Link>
          </div>

          <nav className="scroll-thin flex-1 overflow-y-auto px-3 py-3">
            {nav.map((group) => (
              <div key={group.label} className="mb-4">
                <div className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-faint">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink key={item.href} {...item} />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-border px-3 py-3">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex w-full items-center justify-between rounded-[var(--radius)] border border-border bg-bg px-2.5 py-1.5 text-[12px] text-ink-muted hover:border-border-strong hover:text-ink"
            >
              <span className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5" />
                Search
              </span>
              <kbd className="rounded border border-border bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px]">
                ⌘K
              </kbd>
            </button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="fixed inset-x-0 top-0 z-40 flex h-12 items-center justify-between border-b border-border bg-bg-elevated px-3 lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="rounded-[var(--radius)] p-2 hover:bg-bg-hover"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Link href="/" className="font-serif text-lg">
            PH.D. OS
          </Link>
          <button
            type="button"
            aria-label="Search"
            onClick={() => setPaletteOpen(true)}
            className="rounded-[var(--radius)] p-2 hover:bg-bg-hover"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile drawer */}
        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              className="absolute inset-0 bg-ink/30"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-[260px] flex-col border-r border-border bg-bg-elevated shadow-[var(--shadow-md)]">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="font-serif text-xl">PH.D. OS</div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="rounded p-1 hover:bg-bg-hover"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-3">
                {nav.map((group) => (
                  <div key={group.label} className="mb-4">
                    <div className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-faint">
                      {group.label}
                    </div>
                    <div className="space-y-0.5">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.href}
                          {...item}
                          onClick={() => setOpen(false)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </aside>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 pt-12 lg:pt-0">
          <div className="mx-auto max-w-[1200px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            {!hydrated ? (
              <div className="space-y-3 animate-in">
                <div className="skeleton h-8 w-48" />
                <div className="skeleton h-4 w-72" />
                <div className="skeleton mt-6 h-40 w-full" />
              </div>
            ) : (
              <div className="animate-in">{children}</div>
            )}
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <DataSync />
    </div>
  );
}
