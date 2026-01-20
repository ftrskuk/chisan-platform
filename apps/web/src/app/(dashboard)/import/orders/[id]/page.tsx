"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ship, DollarSign, Clock, Package } from "lucide-react";

import {
  useImportOrder,
  useImportOrderHistory,
  useShipments,
  useImportCosts,
} from "@/hooks/api";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { ImportOrderStatusBadge } from "@/components/import";
import { shipmentColumns } from "@/components/import/shipment-columns";
import { importCostColumns } from "@/components/import/import-cost-columns";
import {
  currencySymbols,
  importOrderStatusLabels,
} from "@/lib/constants/import-labels";
import type { Currency } from "@repo/shared";

function formatCurrency(amount: number, currency: Currency): string {
  const symbol = currencySymbols[currency];
  return `${symbol}${amount.toLocaleString()}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("ko-KR");
}

export default function ImportOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const { data: order, isLoading, error } = useImportOrder(orderId);
  const { data: history } = useImportOrderHistory(orderId);
  const { data: shipmentsResponse } = useShipments({
    importOrderId: orderId,
    limit: 100,
    offset: 0,
  });
  const { data: costsResponse } = useImportCosts({
    importOrderId: orderId,
    limit: 100,
    offset: 0,
  });

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/import/orders">
            <Button variant="ghost" size="icon" aria-label="뒤로 가기">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <PageHeader title="오류" description="주문을 불러올 수 없습니다." />
        </div>
        <div className="rounded-lg border bg-destructive/10 p-6 text-center text-destructive">
          {error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다."}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const shipments = shipmentsResponse?.data ?? [];
  const costs = costsResponse?.data ?? [];
  const totalCostKrw = costs.reduce((sum, c) => sum + (c.amountKrw ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/import/orders">
          <Button
            variant="ghost"
            size="icon"
            className="mt-1"
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={`PO ${order.poNumber}`}
          description={`${order.partner.name} | ${formatDate(order.orderDate)}`}
          action={<ImportOrderStatusBadge status={order.status} />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 금액</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(order.totalAmount, order.currency)}
            </div>
            {order.totalAmountKrw && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(order.totalAmountKrw, "KRW")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">품목 수</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{order.itemCount}</div>
            <p className="text-xs text-muted-foreground">
              총 {order.totalQuantity.toLocaleString()}개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">선적 현황</CardTitle>
            <Ship className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{order.shipmentCount}</div>
            <p className="text-xs text-muted-foreground">
              {order.totalShipped.toLocaleString()} /{" "}
              {order.totalQuantity.toLocaleString()} 선적
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">부대비용</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCostKrw, "KRW")}
            </div>
            <p className="text-xs text-muted-foreground">{costs.length}건</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>주문 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">공급업체</span>
                <p className="font-medium">{order.partner.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">주문일</span>
                <p className="font-medium">{formatDate(order.orderDate)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">예상 ETD</span>
                <p className="font-medium">{formatDate(order.expectedEtd)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">예상 ETA</span>
                <p className="font-medium">{formatDate(order.expectedEta)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">결제조건</span>
                <p className="font-medium">{order.paymentTerms ?? "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">환율</span>
                <p className="font-medium">
                  {order.exchangeRate?.toLocaleString() ?? "-"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">요청자</span>
                <p className="font-medium">
                  {order.requestedByUser.displayName}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">확정자</span>
                <p className="font-medium">
                  {order.confirmedByUser?.displayName ?? "-"}
                </p>
              </div>
            </div>
            {order.memo && (
              <div className="pt-4 border-t">
                <span className="text-sm text-muted-foreground">메모</span>
                <p className="text-sm whitespace-pre-wrap">{order.memo}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>품목 목록</CardTitle>
            <CardDescription>{order.items.length}개 품목</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {item.item.paperType.nameKo ?? item.item.paperType.nameEn}
                      {item.item.brand && ` (${item.item.brand.name})`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.widthMm}mm | {item.item.grammage}gsm
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {item.quantity.toLocaleString()}개
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.unitPrice, order.currency)}/개
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            선적 현황
          </CardTitle>
          <CardDescription>{shipments.length}건의 선적</CardDescription>
        </CardHeader>
        <CardContent>
          {shipments.length > 0 ? (
            <DataTable
              columns={shipmentColumns()}
              data={shipments}
              pageSize={5}
            />
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              등록된 선적이 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            부대비용
          </CardTitle>
          <CardDescription>{costs.length}건의 비용</CardDescription>
        </CardHeader>
        <CardContent>
          {costs.length > 0 ? (
            <DataTable
              columns={importCostColumns()}
              data={costs}
              pageSize={5}
            />
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              등록된 부대비용이 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            이력
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history && history.length > 0 ? (
            <div className="space-y-4">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-start gap-4 text-sm border-l-2 border-muted pl-4"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {h.previousStatus && h.newStatus
                        ? `${importOrderStatusLabels[h.previousStatus as keyof typeof importOrderStatusLabels] ?? h.previousStatus} → ${importOrderStatusLabels[h.newStatus as keyof typeof importOrderStatusLabels] ?? h.newStatus}`
                        : h.action}
                    </p>
                    {h.memo && (
                      <p className="text-muted-foreground">{h.memo}</p>
                    )}
                  </div>
                  <div className="text-right text-muted-foreground">
                    <p>{h.actor.displayName}</p>
                    <p className="text-xs">{formatDateTime(h.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              이력이 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
