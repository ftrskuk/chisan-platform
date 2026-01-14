"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import type { Partner, PartnerType } from "@repo/shared";

interface ColumnActions {
  onEdit: (partner: Partner) => void;
  onDelete: (partner: Partner) => void;
  onManageBrands: (partner: Partner) => void;
}

const partnerTypeMap: Record<PartnerType, "supplier" | "customer" | "both"> = {
  supplier: "supplier",
  customer: "customer",
  both: "both",
};

export function partnerColumns({
  onEdit,
  onDelete,
  onManageBrands,
}: ColumnActions): ColumnDef<Partner>[] {
  return [
    {
      accessorKey: "partnerCode",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="거래처 코드" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("partnerCode")}</span>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="거래처명" />
      ),
    },
    {
      accessorKey: "partnerType",
      header: "유형",
      cell: ({ row }) => (
        <StatusBadge variant={partnerTypeMap[row.original.partnerType]} />
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "countryCode",
      header: "국가",
      cell: ({ row }) => row.getValue("countryCode") || "-",
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
      id: "actions",
      cell: ({ row }) => (
        <DataTableRowActions
          actions={[
            { label: "수정", onClick: () => onEdit(row.original) },
            {
              label: "브랜드 관리",
              onClick: () => onManageBrands(row.original),
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
