"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useOrders,
  useStartFieldProcessing,
  useCompleteFieldProcessing,
} from "@/hooks/api";
import { PageHeader } from "@/components/layout";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/components/loading-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Play, CheckCircle, Package } from "lucide-react";
import { toast } from "sonner";
import type {
  OrderWithRelations,
  OrderType,
  OrderItemWithRelations,
} from "@repo/shared";

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

interface ProcessFormItem {
  orderItemId: string;
  processedQty: number;
  processedWeightKg?: number;
  notes?: string;
}

export default function FieldQueuePage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [processItems, setProcessItems] = useState<ProcessFormItem[]>([]);
  const [processMemo, setProcessMemo] = useState("");

  const { data: ordersResponse, isLoading } = useOrders({
    statuses: ["pending", "field_processing"],
    limit: 50,
    offset: 0,
  });

  const startProcessing = useStartFieldProcessing();
  const completeProcessing = useCompleteFieldProcessing();

  const orders = useMemo(
    () => ordersResponse?.data ?? [],
    [ordersResponse?.data],
  );

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === "pending"),
    [orders],
  );

  const processingOrders = useMemo(
    () => orders.filter((o) => o.status === "field_processing"),
    [orders],
  );

  const itemsById = useMemo(() => {
    if (!selectedOrder) return new Map<string, OrderItemWithRelations>();
    return new Map(selectedOrder.items.map((item) => [item.id, item]));
  }, [selectedOrder]);

  const hasInvalidQty = useMemo(
    () =>
      processItems.some(
        (item) => !Number.isFinite(item.processedQty) || item.processedQty < 0,
      ),
    [processItems],
  );

  const canComplete =
    !!selectedOrder && !hasInvalidQty && !completeProcessing.isPending;

  const closeProcessDialog = useCallback(() => {
    setIsProcessDialogOpen(false);
    setSelectedOrderId(null);
    setProcessItems([]);
    setProcessMemo("");
  }, []);

  const handleStartProcessing = useCallback(
    async (order: OrderWithRelations) => {
      try {
        await startProcessing.mutateAsync(order.id);
        toast.success(`주문 ${order.orderNumber} 작업을 시작합니다.`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "작업 시작에 실패했습니다.",
        );
      }
    },
    [startProcessing],
  );

  const openProcessDialog = useCallback((order: OrderWithRelations) => {
    setSelectedOrderId(order.id);
    setProcessItems(
      order.items.map((item) => ({
        orderItemId: item.id,
        processedQty: item.requestedQty,
        processedWeightKg: item.requestedWeightKg ?? undefined,
        notes: item.notes ?? undefined,
      })),
    );
    setProcessMemo("");
    setIsProcessDialogOpen(true);
  }, []);

  const handleUpdateItemQty = useCallback(
    (orderItemId: string, qty: number) => {
      setProcessItems((prev) =>
        prev.map((item) =>
          item.orderItemId === orderItemId
            ? { ...item, processedQty: qty }
            : item,
        ),
      );
    },
    [],
  );

  const handleCompleteProcessing = useCallback(async () => {
    if (!selectedOrder) return;

    if (hasInvalidQty) {
      toast.error("처리수량을 0 이상으로 입력해주세요.");
      return;
    }

    try {
      await completeProcessing.mutateAsync({
        id: selectedOrder.id,
        data: {
          items: processItems,
          memo: processMemo || undefined,
        },
      });
      toast.success(`주문 ${selectedOrder.orderNumber} 처리가 완료되었습니다.`);
      closeProcessDialog();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "처리 완료에 실패했습니다.",
      );
    }
  }, [
    selectedOrder,
    hasInvalidQty,
    completeProcessing,
    processItems,
    processMemo,
    closeProcessDialog,
  ]);

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeProcessDialog();
      }
    },
    [closeProcessDialog],
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="현장 작업"
        description="현장에서 처리할 주문 목록입니다. 작업을 시작하고 완료 처리하세요."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="py-4">
          <CardContent className="flex items-center gap-3 px-4">
            <div className="rounded-full bg-yellow-100 p-2">
              <Package className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingOrders.length}</p>
              <p className="text-xs text-muted-foreground">대기중</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="flex items-center gap-3 px-4">
            <div className="rounded-full bg-blue-100 p-2">
              <Play className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{processingOrders.length}</p>
              <p className="text-xs text-muted-foreground">처리중</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4 col-span-2 sm:col-span-1">
          <CardContent className="flex items-center gap-3 px-4">
            <div className="rounded-full bg-gray-100 p-2">
              <CheckCircle className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-xs text-muted-foreground">전체</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {processingOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Play className="h-5 w-5 text-blue-600" />
            처리중인 주문
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {processingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onProcess={() => openProcessDialog(order)}
              />
            ))}
          </div>
        </div>
      )}

      {pendingOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-yellow-600" />
            대기중인 주문
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStart={() => handleStartProcessing(order)}
                isStarting={
                  startProcessing.isPending &&
                  startProcessing.variables === order.id
                }
              />
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">처리할 주문이 없습니다</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              새로운 주문이 들어오면 여기에 표시됩니다.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isProcessDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>작업 완료 처리</DialogTitle>
            <DialogDescription>
              주문번호: {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">유형:</span>{" "}
                    <Badge
                      variant={
                        selectedOrder.type === "stock_in"
                          ? "default"
                          : "secondary"
                      }
                      className="ml-1"
                    >
                      {typeLabels[selectedOrder.type]}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">사유:</span>{" "}
                    {reasonLabels[selectedOrder.reason] ?? selectedOrder.reason}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">처리 수량 입력</Label>
                {processItems.map((processItem) => {
                  const orderItem = itemsById.get(processItem.orderItemId);
                  if (!orderItem) return null;

                  const isInvalid =
                    !Number.isFinite(processItem.processedQty) ||
                    processItem.processedQty < 0;

                  return (
                    <div
                      key={processItem.orderItemId}
                      className="rounded-lg border p-3 space-y-2"
                    >
                      <div className="font-medium text-sm">
                        {orderItem.item.itemCode} - {orderItem.item.displayName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        폭: {orderItem.widthMm}mm | 요청수량:{" "}
                        {orderItem.requestedQty}
                      </div>
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`qty-${processItem.orderItemId}`}
                          className="text-sm whitespace-nowrap"
                        >
                          처리수량:
                        </Label>
                        <Input
                          id={`qty-${processItem.orderItemId}`}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={1}
                          value={
                            Number.isFinite(processItem.processedQty)
                              ? processItem.processedQty
                              : ""
                          }
                          onChange={(e) => {
                            const value = e.currentTarget.valueAsNumber;
                            handleUpdateItemQty(
                              processItem.orderItemId,
                              Number.isNaN(value) ? NaN : value,
                            );
                          }}
                          className="w-24"
                          aria-invalid={isInvalid}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                <Label htmlFor="processMemo">메모 (선택)</Label>
                <Textarea
                  id="processMemo"
                  placeholder="작업 메모를 입력하세요..."
                  value={processMemo}
                  onChange={(e) => setProcessMemo(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeProcessDialog}>
              취소
            </Button>
            <LoadingButton
              onClick={handleCompleteProcessing}
              loading={completeProcessing.isPending}
              disabled={!canComplete}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              처리 완료
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface OrderCardProps {
  order: OrderWithRelations;
  onStart?: () => void;
  onProcess?: () => void;
  isStarting?: boolean;
}

function OrderCard({ order, onStart, onProcess, isStarting }: OrderCardProps) {
  const isPending = order.status === "pending";
  const isProcessing = order.status === "field_processing";

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-mono">
            {order.orderNumber}
          </CardTitle>
          <div className="flex items-center gap-1">
            {order.isUrgent && (
              <Badge variant="destructive" className="text-xs">
                긴급
              </Badge>
            )}
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
        <CardDescription className="flex items-center gap-2">
          <Badge
            variant={order.type === "stock_in" ? "default" : "secondary"}
            className="text-xs"
          >
            {typeLabels[order.type]}
          </Badge>
          <span>{reasonLabels[order.reason] ?? order.reason}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">품목수:</span>
          <span className="font-medium">{order.itemCount}개</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">요청수량:</span>
          <span className="font-medium">{order.totalRequestedQty}</span>
        </div>
        {order.partner && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">거래처:</span>
            <span className="font-medium truncate max-w-[150px]">
              {order.partner.name}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">요청자:</span>
          <span className="font-medium">
            {order.requestedByUser?.displayName}
          </span>
        </div>
        {order.memo && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground line-clamp-2">
              {order.memo}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        {isPending && onStart && (
          <LoadingButton
            className="w-full"
            onClick={onStart}
            loading={isStarting}
          >
            <Play className="mr-2 h-4 w-4" />
            작업 시작
          </LoadingButton>
        )}
        {isProcessing && onProcess && (
          <Button className="w-full" variant="default" onClick={onProcess}>
            <CheckCircle className="mr-2 h-4 w-4" />
            처리 완료
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
