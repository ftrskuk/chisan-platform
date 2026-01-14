"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import type { PaperType } from "@repo/shared";

interface ColumnActions {
  onEdit: (paperType: PaperType) => void;
}

export function paperTypeColumns({
  onEdit,
}: ColumnActions): ColumnDef<PaperType>[] {
  return [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="코드" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("code")}</span>
      ),
    },
    {
      accessorKey: "nameEn",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="영문명" />
      ),
    },
    {
      accessorKey: "nameKo",
      header: "한글명",
      cell: ({ row }) => row.getValue("nameKo") || "-",
    },
    {
      accessorKey: "description",
      header: "설명",
      cell: ({ row }) => {
        const desc = row.getValue("description") as string | null;
        return desc ? (
          <span className="max-w-[200px] truncate">{desc}</span>
        ) : (
          "-"
        );
      },
    },
    {
      accessorKey: "sortOrder",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="정렬순서" />
      ),
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
      id: "actions",
      cell: ({ row }) => (
        <DataTableRowActions
          actions={[{ label: "수정", onClick: () => onEdit(row.original) }]}
        />
      ),
    },
  ];
}
