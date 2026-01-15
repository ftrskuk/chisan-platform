"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import type { Brand } from "@repo/shared";

interface ColumnActions {
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
}

export function brandColumns({
  onEdit,
  onDelete,
}: ColumnActions): ColumnDef<Brand>[] {
  return [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="코드" />
      ),
      cell: ({ row }) => (
        <span className="font-medium uppercase">{row.getValue("code")}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "브랜드명",
    },
    {
      accessorKey: "description",
      header: "설명",
      cell: ({ row }) => (
        <span className="max-w-[240px] truncate">
          {row.getValue("description") || "-"}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "상태",
      cell: ({ row }) => (
        <StatusBadge variant={row.original.isActive ? "active" : "inactive"} />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DataTableRowActions
          actions={[
            { label: "수정", onClick: () => onEdit(row.original) },
            {
              label: "삭제",
              onClick: () => onDelete(row.original),
              variant: "destructive",
            },
          ]}
        />
      ),
    },
  ];
}
