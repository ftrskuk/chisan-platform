"use client";

import { ColumnDef } from "@tanstack/react-table";
import { X } from "lucide-react";
import {
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import type { UserWithRoles, UserRole } from "@repo/shared";

interface ColumnActions {
  onToggleActive: (user: UserWithRoles) => void;
  onAssignRole: (user: UserWithRoles) => void;
  onRemoveRole: (user: UserWithRoles, role: UserRole) => void;
}

const roleVariantMap: Record<UserRole, "admin" | "manager" | "worker"> = {
  admin: "admin",
  manager: "manager",
  worker: "worker",
};

export function userColumns({
  onToggleActive,
  onAssignRole,
  onRemoveRole,
}: ColumnActions): ColumnDef<UserWithRoles>[] {
  return [
    {
      accessorKey: "displayName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="사용자" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <img
                className="h-8 w-8 rounded-full object-cover"
                src={user.avatarUrl}
                alt=""
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                {(user.displayName ?? user.email).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {user.displayName ?? "-"}
              </span>
              <span className="text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "roles",
      header: "역할",
      cell: ({ row }) => {
        const user = row.original;
        if (user.roles.length === 0) {
          return (
            <span className="text-sm text-muted-foreground">역할 없음</span>
          );
        }
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {user.roles.map((role) => (
              <div
                key={role}
                className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5"
              >
                <StatusBadge variant={roleVariantMap[role]} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-slate-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveRole(user, role);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const roles = row.getValue(id) as UserRole[];
        return value.some((v: string) => roles.includes(v as UserRole));
      },
    },
    {
      accessorKey: "isActive",
      header: "상태",
      cell: ({ row }) => (
        <StatusBadge variant={row.original.isActive ? "active" : "inactive"} />
      ),
      filterFn: (row, id, value) => {
        return value.includes(String(row.getValue(id)));
      },
    },
    {
      accessorKey: "lastLoginAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="최종 로그인" />
      ),
      cell: ({ row }) => {
        const lastLogin = row.original.lastLoginAt;
        if (!lastLogin) return <span className="text-muted-foreground">-</span>;
        return (
          <span className="text-sm">
            {new Date(lastLogin).toLocaleString("ko-KR")}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DataTableRowActions
            actions={[
              { label: "역할 추가", onClick: () => onAssignRole(user) },
              {
                label: user.isActive ? "비활성화" : "활성화",
                onClick: () => onToggleActive(user),
                variant: user.isActive ? "destructive" : "default",
              },
            ]}
          />
        );
      },
    },
  ];
}
