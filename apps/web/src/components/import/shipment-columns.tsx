"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { DataTableColumnHeader } from "@/components/data-table";
import { ShipmentStatusBadge } from "./shipment-status-badge";
import type { ShipmentWithRelations } from "@repo/shared";
import { Badge } from "@/components/ui/badge";

export function shipmentColumns(): ColumnDef<ShipmentWithRelations>[] {
  return [
    {
      accessorKey: "shipmentNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="선적번호" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/import/shipments/${row.original.id}`}
          className="font-mono text-sm text-primary hover:underline"
        >
          {row.original.shipmentNumber}
        </Link>
      ),
    },
    {
      accessorKey: "status",
      header: "상태",
      cell: ({ row }) => <ShipmentStatusBadge status={row.original.status} />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "importOrder",
      header: "PO번호",
      cell: ({ row }) => (
        <Link
          href={`/import/orders/${row.original.importOrder.id}`}
          className="font-mono text-sm text-muted-foreground hover:underline"
        >
          {row.original.importOrder.poNumber}
        </Link>
      ),
    },
    {
      accessorKey: "partner",
      header: "공급업체",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.partner?.name ?? "-"}</span>
      ),
    },
    {
      accessorKey: "blNumber",
      header: "B/L번호",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.blNumber ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "vesselName",
      header: "선박명",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.vesselName ?? "-"}</span>
      ),
    },
    {
      accessorKey: "containerCount",
      header: "컨테이너",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.containerCount}개</Badge>
      ),
    },
    {
      accessorKey: "itemCount",
      header: "품목수",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.itemCount}개</span>
      ),
    },
    {
      accessorKey: "totalShippedQuantity",
      header: "선적수량",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.totalShippedQuantity}</span>
      ),
    },
    {
      accessorKey: "etd",
      header: "ETD",
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {row.original.etd
            ? new Date(row.original.etd).toLocaleDateString("ko-KR")
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "eta",
      header: "ETA",
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {row.original.eta
            ? new Date(row.original.eta).toLocaleDateString("ko-KR")
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "portOfLoading",
      header: "선적항",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.portOfLoading ?? "-"}</span>
      ),
    },
    {
      accessorKey: "portOfDischarge",
      header: "도착항",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.portOfDischarge ?? "-"}</span>
      ),
    },
  ];
}
