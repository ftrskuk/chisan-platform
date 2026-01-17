"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { OrderStatusBadge } from "./order-status-badge";
import type { OrderWithRelations, OrderType } from "@repo/shared";
import { Badge } from "@/components/ui/badge";

const typeLabels: Record<OrderType, string> = {
  stock_in: "입고",
  stock_out: "출고",
};

const reasonLabels: Record<string, string> = {
  container: "컨테이너 수입",
  domestic_purchase: "국내 구매",
  warehouse_transfer: "창고 이동",
  return: "반품",
  adjustment: "재고 조정",
  sales: "판매",
  sample: "샘플",
  slitting: "슬리팅",
  loss: "손실/폐기",
};

export function orderColumns(): ColumnDef<OrderWithRelations>[] {
  return [
    {
      accessorKey: "orderNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="주문번호" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.orderNumber}</span>
      ),
    },
    {
      accessorKey: "type",
      header: "유형",
      cell: ({ row }) => (
        <Badge
          variant={row.original.type === "stock_in" ? "default" : "secondary"}
        >
          {typeLabels[row.original.type]}
        </Badge>
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "status",
      header: "상태",
      cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "reason",
      header: "사유",
      cell: ({ row }) => (
        <span className="text-sm">
          {reasonLabels[row.original.reason] ?? row.original.reason}
        </span>
      ),
    },
    {
      accessorKey: "isUrgent",
      header: "긴급",
      cell: ({ row }) =>
        row.original.isUrgent ? (
          <Badge variant="destructive" className="text-xs">
            긴급
          </Badge>
        ) : null,
    },
    {
      accessorKey: "partner",
      header: "거래처",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.partner?.name ?? "-"}</span>
      ),
    },
    {
      accessorKey: "itemCount",
      header: "품목수",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.itemCount}개</span>
      ),
    },
    {
      accessorKey: "totalRequestedQty",
      header: "요청수량",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.totalRequestedQty}</span>
      ),
    },
    {
      accessorKey: "scheduledDate",
      header: "예정일",
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {row.original.scheduledDate
            ? new Date(row.original.scheduledDate).toLocaleDateString("ko-KR")
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "requestedByUser",
      header: "요청자",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.requestedByUser?.displayName ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="생성일시" />
      ),
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {new Date(row.original.createdAt).toLocaleString("ko-KR")}
        </span>
      ),
    },
  ];
}
