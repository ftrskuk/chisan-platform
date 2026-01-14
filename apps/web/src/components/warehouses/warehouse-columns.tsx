"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { DataTableRowActions } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import type { Warehouse } from "@repo/shared";

interface ColumnActions {
  onEdit: (warehouse: Warehouse) => void;
  onDelete: (warehouse: Warehouse) => void;
  onManageLocations: (warehouse: Warehouse) => void;
}

export function warehouseColumns({
  onEdit,
  onDelete,
  onManageLocations,
}: ColumnActions): ColumnDef<Warehouse>[] {
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
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="창고명" />
      ),
    },
    {
      accessorKey: "city",
      header: "도시",
      cell: ({ row }) => row.getValue("city") || "-",
    },
    {
      accessorKey: "contactName",
      header: "담당자",
      cell: ({ row }) => row.getValue("contactName") || "-",
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
      accessorKey: "isDefault",
      header: "기본",
      cell: ({ row }) =>
        row.original.isDefault ? <Badge variant="secondary">기본</Badge> : null,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DataTableRowActions
          actions={[
            { label: "수정", onClick: () => onEdit(row.original) },
            {
              label: "로케이션 관리",
              onClick: () => onManageLocations(row.original),
            },
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
