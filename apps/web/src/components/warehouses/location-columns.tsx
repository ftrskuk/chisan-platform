"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import type { Location, LocationType } from "@repo/shared";

interface ColumnActions {
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
}

const locationTypeLabels: Record<LocationType, string> = {
  default: "기본",
  zone: "구역",
  rack: "랙",
  shelf: "선반",
  floor: "층",
};

export function locationColumns({
  onEdit,
  onDelete,
}: ColumnActions): ColumnDef<Location>[] {
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
      header: "이름",
      cell: ({ row }) => row.getValue("name") || "-",
    },
    {
      accessorKey: "type",
      header: "유형",
      cell: ({ row }) => {
        const type = row.getValue("type") as LocationType;
        return <Badge variant="outline">{locationTypeLabels[type]}</Badge>;
      },
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
