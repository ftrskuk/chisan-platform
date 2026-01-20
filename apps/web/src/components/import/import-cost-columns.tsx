"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import type { ImportCost } from "@repo/shared";
import { Badge } from "@/components/ui/badge";
import {
  importCostTypeLabels,
  currencySymbols,
} from "@/lib/constants/import-labels";
import { Check, X } from "lucide-react";

export function importCostColumns(): ColumnDef<ImportCost>[] {
  return [
    {
      accessorKey: "costType",
      header: "비용유형",
      cell: ({ row }) => (
        <Badge variant="outline">
          {importCostTypeLabels[row.original.costType]}
        </Badge>
      ),
    },
    {
      accessorKey: "description",
      header: "설명",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.description ?? "-"}</span>
      ),
    },
    {
      accessorKey: "amount",
      header: "금액",
      cell: ({ row }) => {
        const symbol = currencySymbols[row.original.currency];
        return (
          <span className="text-sm font-medium">
            {symbol}
            {row.original.amount.toLocaleString()}
          </span>
        );
      },
    },
    {
      accessorKey: "currency",
      header: "통화",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono">
          {row.original.currency}
        </Badge>
      ),
    },
    {
      accessorKey: "amountKrw",
      header: "원화금액",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.original.amountKrw
            ? `₩${row.original.amountKrw.toLocaleString()}`
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "vendorName",
      header: "업체명",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.vendorName ?? "-"}</span>
      ),
    },
    {
      accessorKey: "invoiceNumber",
      header: "청구서번호",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.invoiceNumber ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "isPaid",
      header: "결제여부",
      cell: ({ row }) =>
        row.original.isPaid ? (
          <div className="flex items-center gap-1 text-emerald-600">
            <Check className="h-4 w-4" />
            <span className="text-sm">결제완료</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="text-sm">미결제</span>
          </div>
        ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="등록일" />
      ),
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {new Date(row.original.createdAt).toLocaleDateString("ko-KR")}
        </span>
      ),
    },
  ];
}
