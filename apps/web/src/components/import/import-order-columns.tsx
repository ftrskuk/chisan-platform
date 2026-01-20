"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { DataTableColumnHeader } from "@/components/data-table";
import { ImportOrderStatusBadge } from "./import-order-status-badge";
import type { ImportOrderWithRelations } from "@repo/shared";
import { Badge } from "@/components/ui/badge";
import { currencySymbols } from "@/lib/constants/import-labels";

export function importOrderColumns(): ColumnDef<ImportOrderWithRelations>[] {
  return [
    {
      accessorKey: "poNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="PO번호" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/import/orders/${row.original.id}`}
          className="font-mono text-sm text-primary hover:underline"
        >
          {row.original.poNumber}
        </Link>
      ),
    },
    {
      accessorKey: "status",
      header: "상태",
      cell: ({ row }) => (
        <ImportOrderStatusBadge status={row.original.status} />
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "partner",
      header: "공급업체",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.partner?.name ?? "-"}</span>
      ),
    },
    {
      accessorKey: "currency",
      header: "통화",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.currency}
        </Badge>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "총액",
      cell: ({ row }) => {
        const symbol = currencySymbols[row.original.currency];
        return (
          <span className="text-sm font-medium">
            {symbol}
            {row.original.totalAmount.toLocaleString()}
          </span>
        );
      },
    },
    {
      accessorKey: "itemCount",
      header: "품목수",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.itemCount}개</span>
      ),
    },
    {
      accessorKey: "totalQuantity",
      header: "총수량",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.totalQuantity}</span>
      ),
    },
    {
      accessorKey: "shipmentCount",
      header: "선적",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.totalShipped}/{row.original.totalQuantity}
        </span>
      ),
    },
    {
      accessorKey: "expectedEta",
      header: "예상 도착일",
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {row.original.expectedEta
            ? new Date(row.original.expectedEta).toLocaleDateString("ko-KR")
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "orderDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="주문일" />
      ),
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {new Date(row.original.orderDate).toLocaleDateString("ko-KR")}
        </span>
      ),
    },
    {
      accessorKey: "requestedByUser",
      header: "담당자",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.requestedByUser?.displayName ?? "-"}
        </span>
      ),
    },
  ];
}
