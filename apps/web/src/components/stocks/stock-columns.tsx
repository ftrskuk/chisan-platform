"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import type {
  StockWithRelations,
  StockCondition,
  StockStatus,
} from "@repo/shared";

const conditionMap: Record<StockCondition, "parent" | "slitted"> = {
  parent: "parent",
  slitted: "slitted",
};

const statusMap: Record<
  StockStatus,
  "available" | "reserved" | "quarantine" | "disposed"
> = {
  available: "available",
  reserved: "reserved",
  quarantine: "quarantine",
  disposed: "disposed",
};

export function stockColumns(): ColumnDef<StockWithRelations>[] {
  return [
    {
      accessorKey: "item.itemCode",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="품목 코드" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.item.itemCode}</span>
      ),
    },
    {
      accessorKey: "item.displayName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="품목명" />
      ),
      cell: ({ row }) => row.original.item.displayName,
    },
    {
      id: "paperType",
      accessorFn: (row) => row.item.paperType?.nameEn,
      header: "지종",
      cell: ({ row }) => row.original.item.paperType?.nameEn || "-",
    },
    {
      accessorKey: "widthMm",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="폭 (mm)" />
      ),
      cell: ({ row }) => `${row.getValue("widthMm")} mm`,
    },
    {
      accessorKey: "condition",
      header: "유형",
      cell: ({ row }) => {
        const condition = row.original.condition;
        return <StatusBadge variant={conditionMap[condition] ?? "parent"} />;
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="수량" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("quantity")}</span>
      ),
    },
    {
      accessorKey: "weightKg",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="중량 (kg)" />
      ),
      cell: ({ row }) => {
        const weight = row.original.weightKg;
        return weight ? `${weight.toLocaleString()} kg` : "-";
      },
    },
    {
      id: "warehouse",
      accessorFn: (row) => row.warehouse?.name,
      header: "창고",
      cell: ({ row }) => row.original.warehouse?.name || "-",
      filterFn: (row, id, value) => {
        return value.includes(row.original.warehouse?.id);
      },
    },
    {
      id: "location",
      accessorFn: (row) => row.location?.code,
      header: "위치",
      cell: ({ row }) => row.original.location?.code || "-",
    },
    {
      accessorKey: "status",
      header: "재고 상태",
      cell: ({ row }) => {
        const status = row.original.status;
        return <StatusBadge variant={statusMap[status] ?? "available"} />;
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "batchNumber",
      header: "배치 번호",
      cell: ({ row }) => row.original.batchNumber || "-",
    },
  ];
}
