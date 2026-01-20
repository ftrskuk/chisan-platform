"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  Clock,
  Package,
  FileText,
  Container,
} from "lucide-react";

import { useShipment, useShipmentHistory, useImportCosts } from "@/hooks/api";
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
import {
  ShipmentStatusBadge,
  ReceiveShipmentDialog,
} from "@/components/import";
import { importCostColumns } from "@/components/import/import-cost-columns";
import {
  currencySymbols,
  shipmentStatusLabels,
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

export default function ShipmentDetailPage() {
  const params = useParams<{ id: string }>();
  const shipmentId = params.id;

  const { data: shipment, isLoading, error, refetch } = useShipment(shipmentId);
  const { data: history, refetch: refetchHistory } =
    useShipmentHistory(shipmentId);
  const { data: costsResponse } = useImportCosts({
    shipmentId: shipmentId,
    limit: 100,
    offset: 0,
  });

  const handleReceiveSuccess = () => {
    refetch();
    refetchHistory();
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/import/shipments">
            <Button variant="ghost" size="icon" aria-label="뒤로 가기">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <PageHeader title="오류" description="선적을 불러올 수 없습니다." />
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

  if (!shipment) {
    return null;
  }

  const costs = costsResponse?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/import/shipments">
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
          title={`선적 ${shipment.shipmentNumber}`}
          description={`${shipment.partner.name} | PO: ${shipment.importOrder.poNumber}`}
          action={
            <div className="flex items-center gap-3">
              <ShipmentStatusBadge status={shipment.status} />
              <ReceiveShipmentDialog
                shipment={shipment}
                onSuccess={handleReceiveSuccess}
              />
            </div>
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">컨테이너</CardTitle>
            <Container className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {shipment.containerCount}개
            </div>
            {shipment.containerNumbers.length > 0 && (
              <p className="text-xs text-muted-foreground truncate">
                {shipment.containerNumbers.join(", ")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">선적 수량</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {shipment.totalShippedQuantity.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {shipment.itemCount}개 품목
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">입고 수량</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {shipment.totalReceivedQuantity?.toLocaleString() ?? "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {shipment.totalReceivedQuantity
                ? `${Math.round((shipment.totalReceivedQuantity / shipment.totalShippedQuantity) * 100)}%`
                : "미입고"}
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
              {formatCurrency(shipment.totalCostKrw, "KRW")}
            </div>
            <p className="text-xs text-muted-foreground">{costs.length}건</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>선적 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">B/L 번호</span>
                <p className="font-medium">{shipment.blNumber ?? "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">선박명</span>
                <p className="font-medium">{shipment.vesselName ?? "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">항차</span>
                <p className="font-medium">{shipment.voyageNumber ?? "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">컨테이너 수</span>
                <p className="font-medium">{shipment.containerCount}개</p>
              </div>
              <div>
                <span className="text-muted-foreground">선적항</span>
                <p className="font-medium">{shipment.portOfLoading ?? "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">양하항</span>
                <p className="font-medium">{shipment.portOfDischarge ?? "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>일정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">예상 ETD</span>
                <p className="font-medium">{formatDate(shipment.etd)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">예상 ETA</span>
                <p className="font-medium">{formatDate(shipment.eta)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">실제 출항일</span>
                <p className="font-medium">
                  {formatDate(shipment.actualDepartureDate)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">실제 도착일</span>
                <p className="font-medium">
                  {formatDate(shipment.actualArrivalDate)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">통관완료일</span>
                <p className="font-medium">
                  {formatDate(shipment.customsClearedDate)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">입고일</span>
                <p className="font-medium">
                  {formatDate(shipment.deliveredDate)}
                </p>
              </div>
            </div>
            {shipment.memo && (
              <div className="pt-4 border-t">
                <span className="text-sm text-muted-foreground">메모</span>
                <p className="text-sm whitespace-pre-wrap">{shipment.memo}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            품목 목록
          </CardTitle>
          <CardDescription>{shipment.items.length}개 품목</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {shipment.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {item.importOrderItem.item.paperType.nameKo ??
                      item.importOrderItem.item.paperType.nameEn}
                    {item.importOrderItem.item.brand &&
                      ` (${item.importOrderItem.item.brand.name})`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.importOrderItem.widthMm}mm |{" "}
                    {item.importOrderItem.item.grammage}gsm
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    선적: {item.shippedQuantity.toLocaleString()}개
                  </p>
                  <p className="text-xs text-muted-foreground">
                    입고: {item.receivedQuantity?.toLocaleString() ?? "-"} |
                    파손: {item.damagedQuantity.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {shipment.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              문서
            </CardTitle>
            <CardDescription>
              {shipment.documents.length}개 문서
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {shipment.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{doc.filename}</span>
                    <span className="text-xs text-muted-foreground uppercase">
                      ({doc.type})
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      열기
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                        ? `${shipmentStatusLabels[h.previousStatus as keyof typeof shipmentStatusLabels] ?? h.previousStatus} → ${shipmentStatusLabels[h.newStatus as keyof typeof shipmentStatusLabels] ?? h.newStatus}`
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
