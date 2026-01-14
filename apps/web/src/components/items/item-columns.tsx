"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import type { ItemWithRelations, ItemForm } from "@repo/shared";

interface ColumnActions {
  onEdit: (item: ItemWithRelations) => void;
  onDelete: (item: ItemWithRelations) => void;
}

const formTypeMap: Record<ItemForm, "roll" | "sheet"> = {
  roll: "roll",
  sheet: "sheet",
};

export function itemColumns({
  onEdit,
  onDelete,
}: ColumnActions): ColumnDef<ItemWithRelations>[] {
  return [
    {
      accessorKey: "itemCode",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="품목 코드" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("itemCode")}</span>
      ),
    },
    {
      accessorKey: "displayName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="품목명" />
      ),
    },
    {
      id: "paperType",
      accessorFn: (row) => row.paperType?.nameEn,
      header: "지종",
      cell: ({ row }) => row.original.paperType?.nameEn || "-",
      filterFn: (row, id, value) => {
        return value.includes(row.original.paperType?.id);
      },
    },
    {
      id: "brand",
      accessorFn: (row) => row.brand?.name,
      header: "브랜드",
      cell: ({ row }) => row.original.brand?.name || "-",
    },
    {
      accessorKey: "grammage",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="평량" />
      ),
      cell: ({ row }) => `${row.getValue("grammage")} g/m²`,
    },
    {
      accessorKey: "widthMm",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="폭" />
      ),
      cell: ({ row }) => {
        const width = row.getValue("widthMm") as number | null;
        return width ? `${width} mm` : "-";
      },
    },
    {
      accessorKey: "form",
      header: "형태",
      cell: ({ row }) => (
        <StatusBadge variant={formTypeMap[row.original.form]} />
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
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
