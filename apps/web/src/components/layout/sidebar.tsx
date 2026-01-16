"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@repo/shared";
import {
  Home,
  Warehouse,
  Users,
  Package,
  FileText,
  Settings,
  UserCog,
  Boxes,
  PackagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

type NavEntry = NavItem | NavSection;

function isSection(entry: NavEntry): entry is NavSection {
  return "items" in entry;
}

const navigation: NavEntry[] = [
  {
    href: "/dashboard",
    label: "대시보드",
    icon: <Home className="h-[18px] w-[18px]" />,
  },
  {
    title: "기준정보",
    items: [
      {
        href: "/master/warehouses",
        label: "창고 관리",
        icon: <Warehouse className="h-[18px] w-[18px]" />,
      },
      {
        href: "/master/partners",
        label: "거래처 관리",
        icon: <Users className="h-[18px] w-[18px]" />,
      },
      {
        href: "/master/items",
        label: "품목 관리",
        icon: <Package className="h-[18px] w-[18px]" />,
      },
    ],
  },
  {
    title: "재고 관리",
    items: [
      {
        href: "/inventory/stocks",
        label: "재고 조회",
        icon: <Boxes className="h-[18px] w-[18px]" />,
      },
      {
        href: "/inventory/stock-in",
        label: "재고 입고",
        icon: <PackagePlus className="h-[18px] w-[18px]" />,
      },
    ],
  },
  {
    title: "설정",
    items: [
      {
        href: "/settings/users",
        label: "사용자 관리",
        icon: <UserCog className="h-[18px] w-[18px]" />,
        roles: ["admin"],
      },
      {
        href: "/settings/audit-logs",
        label: "감사 로그",
        icon: <FileText className="h-[18px] w-[18px]" />,
        roles: ["admin"],
      },
      {
        href: "/settings/system",
        label: "시스템 설정",
        icon: <Settings className="h-[18px] w-[18px]" />,
        roles: ["admin"],
      },
    ],
  },
];

interface SidebarProps {
  userRoles: UserRole[];
}

export function Sidebar({ userRoles }: SidebarProps) {
  return (
    <aside className="hidden h-full w-[240px] flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <SidebarContent userRoles={userRoles} />
    </aside>
  );
}

interface SidebarContentProps {
  userRoles: UserRole[];
  onNavigate?: () => void;
}

export function SidebarContent({ userRoles, onNavigate }: SidebarContentProps) {
  const pathname = usePathname();

  const filterItems = (items: NavItem[]) =>
    items.filter((item) => {
      if (!item.roles) return true;
      return item.roles.some((role) => userRoles.includes(role));
    });

  const renderNavItem = (item: NavItem) => {
    const isActive =
      pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
          isActive
            ? "bg-white text-primary shadow-sm ring-1 ring-gray-200"
            : "text-muted-foreground hover:bg-gray-100 hover:text-foreground",
        )}
      >
        {isActive && (
          <div className="absolute left-0 ml-1 h-4 w-0.5 rounded-full bg-primary" />
        )}
        <span
          className={cn(
            "flex items-center justify-center transition-colors",
            isActive
              ? "text-primary"
              : "text-gray-400 group-hover:text-foreground",
          )}
        >
          {item.icon}
        </span>
        {item.label}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo Area */}
      <div className="flex h-12 items-center border-b border-sidebar-border px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5"
          onClick={onNavigate}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-gray-800 to-black text-white shadow-sm">
            <span className="text-xs font-bold">C</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none text-foreground">
              CHISAN
            </span>
            <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
              Enterprise Plan
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
        {navigation.map((entry) => {
          if (isSection(entry)) {
            const filteredItems = filterItems(entry.items);
            if (filteredItems.length === 0) return null;

            return (
              <div key={entry.title} className="mb-2">
                <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {entry.title}
                </div>
                <div className="space-y-0.5">
                  {filteredItems.map(renderNavItem)}
                </div>
              </div>
            );
          }

          if (entry.roles && !entry.roles.some((r) => userRoles.includes(r))) {
            return null;
          }

          return (
            <div key={entry.href} className="mb-2 space-y-0.5">
              {renderNavItem(entry)}
            </div>
          );
        })}
      </nav>

      {/* User Profile / Bottom Actions could go here */}
    </div>
  );
}
