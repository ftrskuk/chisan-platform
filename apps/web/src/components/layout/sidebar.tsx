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
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: "기준정보",
    items: [
      {
        href: "/master/warehouses",
        label: "창고 관리",
        icon: <Warehouse className="h-5 w-5" />,
      },
      {
        href: "/master/partners",
        label: "거래처 관리",
        icon: <Users className="h-5 w-5" />,
      },
      {
        href: "/master/items",
        label: "품목 관리",
        icon: <Package className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "설정",
    items: [
      {
        href: "/settings/users",
        label: "사용자 관리",
        icon: <UserCog className="h-5 w-5" />,
        roles: ["admin"],
      },
      {
        href: "/settings/audit-logs",
        label: "감사 로그",
        icon: <FileText className="h-5 w-5" />,
        roles: ["admin"],
      },
      {
        href: "/settings/system",
        label: "시스템 설정",
        icon: <Settings className="h-5 w-5" />,
        roles: ["admin"],
      },
    ],
  },
];

interface SidebarProps {
  userRoles: UserRole[];
}

export function Sidebar({ userRoles }: SidebarProps) {
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
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-blue-50 text-blue-700"
            : "text-gray-700 hover:bg-gray-100",
        )}
      >
        {item.icon}
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/dashboard" className="text-xl font-bold text-gray-900">
          CHISAN
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {navigation.map((entry, index) => {
            if (isSection(entry)) {
              const filteredItems = filterItems(entry.items);
              if (filteredItems.length === 0) return null;

              return (
                <div key={entry.title}>
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {entry.title}
                  </h3>
                  <div className="space-y-1">
                    {filteredItems.map(renderNavItem)}
                  </div>
                </div>
              );
            }

            if (
              entry.roles &&
              !entry.roles.some((r) => userRoles.includes(r))
            ) {
              return null;
            }

            return (
              <div key={entry.href} className="space-y-1">
                {renderNavItem(entry)}
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
