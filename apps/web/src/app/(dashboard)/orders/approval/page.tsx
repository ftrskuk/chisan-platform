"use client";

import { useState } from "react";
import { useOrders, useApproveOrder, useRejectOrder } from "@/hooks/api";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/layout";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/loading-button";
import { Check, X, Eye } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import type { OrderWithRelations } from "@repo/shared";
import { DataTableColumnHeader } from "@/components/data-table";
import { typeLabels, reasonLabels } from "@/lib/constants/order-labels";

export default function ApprovalQueuePage() {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithRelations | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectMemo, setRejectMemo] = useState("");

  const { data: ordersResponse, isLoading } = useOrders({
    status: "awaiting_approval",
    limit: 50,
    offset: 0,
  });

  const approveOrder = useApproveOrder();
  const rejectOrder = useRejectOrder();

  const handleApprove = async (order: OrderWithRelations) => {
    try {
      await approveOrder.mutateAsync({ id: order.id, data: {} });
      toast.success(`주문 ${order.orderNumber}이(가) 승인되었습니다.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "승인에 실패했습니다.",
      );
    }
  };

  const handleReject = async () => {
    if (!selectedOrder || !rejectMemo.trim()) {
      toast.error("반려 사유를 입력해주세요.");
      return;
    }

    try {
      await rejectOrder.mutateAsync({
        id: selectedOrder.id,
        data: { memo: rejectMemo },
      });
      toast.success(`주문 ${selectedOrder.orderNumber}이(가) 반려되었습니다.`);
      setIsRejectOpen(false);
      setRejectMemo("");
      setSelectedOrder(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "반려에 실패했습니다.",
      );
    }
  };

  const openRejectDialog = (order: OrderWithRelations) => {
    setSelectedOrder(order);
    setIsRejectOpen(true);
  };

  const openDetailDialog = (order: OrderWithRelations) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const columns: ColumnDef<OrderWithRelations>[] = [
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
    },
    {
      accessorKey: "status",
      header: "상태",
      cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
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
      accessorKey: "itemCount",
      header: "품목수",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.itemCount}개</span>
      ),
    },
    {
      accessorKey: "totalProcessedQty",
      header: "처리수량",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.totalProcessedQty ?? row.original.totalRequestedQty}
        </span>
      ),
    },
    {
      accessorKey: "processedByUser",
      header: "처리자",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.processedByUser?.displayName ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "processedAt",
      header: "처리일시",
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {row.original.processedAt
            ? new Date(row.original.processedAt).toLocaleString("ko-KR")
            : "-"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "작업",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openDetailDialog(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => handleApprove(row.original)}
            disabled={approveOrder.isPending}
          >
            <Check className="mr-1 h-4 w-4" />
            승인
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => openRejectDialog(row.original)}
          >
            <X className="mr-1 h-4 w-4" />
            반려
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="승인 대기"
        description="현장 처리가 완료되어 승인을 기다리는 주문 목록입니다."
      />

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            총 {ordersResponse?.total ?? 0}건의 승인 대기 주문
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={ordersResponse?.data ?? []}
        isLoading={isLoading}
      />

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>주문 상세</DialogTitle>
            <DialogDescription>
              주문번호: {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">유형:</span>{" "}
                  {typeLabels[selectedOrder.type]}
                </div>
                <div>
                  <span className="text-muted-foreground">사유:</span>{" "}
                  {reasonLabels[selectedOrder.reason] ?? selectedOrder.reason}
                </div>
                <div>
                  <span className="text-muted-foreground">거래처:</span>{" "}
                  {selectedOrder.partner?.name ?? "-"}
                </div>
                <div>
                  <span className="text-muted-foreground">요청자:</span>{" "}
                  {selectedOrder.requestedByUser?.displayName}
                </div>
                <div>
                  <span className="text-muted-foreground">처리자:</span>{" "}
                  {selectedOrder.processedByUser?.displayName ?? "-"}
                </div>
                <div>
                  <span className="text-muted-foreground">처리일시:</span>{" "}
                  {selectedOrder.processedAt
                    ? new Date(selectedOrder.processedAt).toLocaleString(
                        "ko-KR",
                      )
                    : "-"}
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-medium">주문 품목</h4>
                <div className="rounded border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">품목</th>
                        <th className="p-2 text-right">폭(mm)</th>
                        <th className="p-2 text-right">요청수량</th>
                        <th className="p-2 text-right">처리수량</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">
                            {item.item.itemCode} - {item.item.displayName}
                          </td>
                          <td className="p-2 text-right">{item.widthMm}</td>
                          <td className="p-2 text-right">
                            {item.requestedQty}
                          </td>
                          <td className="p-2 text-right">
                            {item.processedQty ?? "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedOrder.memo && (
                <div>
                  <span className="text-muted-foreground">메모:</span>{" "}
                  {selectedOrder.memo}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              닫기
            </Button>
            <Button
              onClick={() => selectedOrder && handleApprove(selectedOrder)}
              disabled={approveOrder.isPending}
            >
              <Check className="mr-1 h-4 w-4" />
              승인
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setIsDetailOpen(false);
                if (selectedOrder) openRejectDialog(selectedOrder);
              }}
            >
              <X className="mr-1 h-4 w-4" />
              반려
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>주문 반려</DialogTitle>
            <DialogDescription>
              주문번호: {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectMemo">반려 사유 (필수)</Label>
              <Textarea
                id="rejectMemo"
                placeholder="반려 사유를 입력하세요..."
                value={rejectMemo}
                onChange={(e) => setRejectMemo(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              취소
            </Button>
            <LoadingButton
              variant="destructive"
              onClick={handleReject}
              loading={rejectOrder.isPending}
              disabled={!rejectMemo.trim()}
            >
              반려
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
