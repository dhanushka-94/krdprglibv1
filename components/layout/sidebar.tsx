"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderTree,
  FolderOpen,
  Music,
  PlusCircle,
  Users,
  FileUp,
  Settings,
  Activity,
  FileBarChart2,
  X,
  UserCircle,
  Radio,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAdminPath } from "@/lib/config";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  settingKey?: string;
};

const navItems = (adminBase: string): NavItem[] => [
  { href: adminBase, label: "Dashboard", icon: LayoutDashboard },
  { href: `${adminBase}/profile`, label: "My Profile", icon: UserCircle },
  { href: `${adminBase}/programmes`, label: "Manage Programmes", icon: Music },
  { href: `${adminBase}/programmes/upload`, label: "Upload Programmes", icon: PlusCircle },
  {
    href: `${adminBase}/import-storage`,
    label: "Import from Storage",
    icon: FileUp,
    settingKey: "import_storage_enabled",
  },
  { href: `${adminBase}/categories`, label: "Categories", icon: FolderTree, adminOnly: true },
  { href: `${adminBase}/subcategories`, label: "Subcategories", icon: FolderOpen, adminOnly: true },
  { href: `${adminBase}/radio-channels`, label: "Radio Channels", icon: Radio, adminOnly: true },
  { href: `${adminBase}/schedules`, label: "Schedules", icon: CalendarClock, adminOnly: true },
  { href: `${adminBase}/reports`, label: "Reports", icon: FileBarChart2, adminOnly: true },
  { href: `${adminBase}/activity-logs`, label: "Activity Logs", icon: Activity, adminOnly: true },
  { href: `${adminBase}/users`, label: "Users", icon: Users, adminOnly: true },
  { href: `${adminBase}/settings`, label: "Settings", icon: Settings },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

export function Sidebar({ mobileOpen: controlledOpen, onClose }: SidebarProps = {}) {
  const pathname = usePathname();
  const adminBase = getAdminPath();
  const [role, setRole] = useState<string | null>(null);
  const [settings, setSettings] = useState<{ import_storage_enabled?: boolean }>({});
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = onClose !== undefined;
  const mobileOpen = isControlled ? (controlledOpen ?? false) : internalOpen;
  const setMobileOpen = isControlled ? (onClose ? (v: boolean) => { if (!v) onClose(); } : () => {}) : setInternalOpen;
  const closeSidebar = () => (isControlled ? onClose?.() : setInternalOpen(false));

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setRole(data.user?.role ?? null));
  }, []);

  useEffect(() => {
    fetch("/api/settings", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => {});
  }, []);

  const items = navItems(adminBase).filter((item) => {
    if ("adminOnly" in item && item.adminOnly && role !== "Admin") return false;
    if ("href" in item && item.href?.includes("/upload") && role === "Viewer") return false;
    // Hide Import from Storage for Viewer role
    if ("href" in item && item.href?.includes("/import-storage") && role === "Viewer") return false;
    if ("settingKey" in item && item.settingKey === "import_storage_enabled") {
      if (settings.import_storage_enabled === false) return false;
    }
    return true;
  });

  const navContent = (
    <>
      <div className="flex h-14 shrink-0 items-center justify-end border-b border-border px-4 md:hidden">
        <button
          type="button"
          onClick={closeSidebar}
          className="rounded p-2 hover:bg-accent"
          aria-label="Close menu"
        >
          <X className="size-5" />
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== adminBase && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeSidebar}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72 max-w-[85vw] flex flex-col border-r border-border bg-card transition-transform duration-200 ease-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar: below the fixed admin header */}
      <aside className="fixed left-0 top-14 z-40 hidden h-[calc(100vh-3.5rem)] w-56 flex-col border-r border-border bg-card md:flex">
        {navContent}
      </aside>
    </>
  );
}
