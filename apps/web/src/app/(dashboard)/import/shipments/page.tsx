"use client";

import { useState } from "react";
import { useShipments } from "@/hooks/api";
import { DataTable } from "@/components/data-table";
import { shipmentColumns } from "@/components/import/shipment-columns";
import { PageHeader } from "@/components/layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { ShipmentSearchInput, ShipmentStatus } from "@repo/shared";
import { SHIPMENT_STATUSES } from "@repo/shared";
import { shipmentStatusLabels } from "@/lib/constants/import-labels";

export default function ShipmentsPage() {
  const [searchParams, setSearchParams] = useState<ShipmentSearchInput>({
    limit: 20,
    offset: 0,
  });

  const { data: shipmentsResponse, isLoading: shipmentsLoading } =
    useShipments(searchParams);

  const handleFilterChange = (
    key: keyof ShipmentSearchInput,
    value: string | undefined,
  ) => {
    setSearchParams((prev) => ({
      ...prev,
      [key]: value === "" || value === "all" ? undefined : value,
      offset: 0,
    }));
  };

  const handleSearch = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      q: value || undefined,
      offset: 0,
    }));
  };

  const clearFilters = () => {
    setSearchParams({
      limit: 20,
      offset: 0,
    });
  };

  const hasActiveFilters =
    searchParams.status ||
    searchParams.etaFrom ||
    searchParams.etaTo ||
    searchParams.q;

  const statusOptions: { label: string; value: ShipmentStatus }[] =
    SHIPMENT_STATUSES.map((status) => ({
      label: shipmentStatusLabels[status],
      value: status,
    }));

  const columnsConfig = shipmentColumns();

  return (
    <div className="space-y-6">
      <PageHeader
        title="선적 관리"
        description="수입 선적을 조회하고 관리합니다."
      />

      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>검색</Label>
            <Input
              placeholder="선적번호, B/L번호 검색..."
              value={searchParams.q ?? ""}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>상태</Label>
            <Select
              value={searchParams.status ?? "all"}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>ETA 시작</Label>
            <Input
              type="date"
              value={searchParams.etaFrom ?? ""}
              onChange={(e) => handleFilterChange("etaFrom", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>ETA 종료</Label>
            <Input
              type="date"
              value={searchParams.etaTo ?? ""}
              onChange={(e) => handleFilterChange("etaTo", e.target.value)}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              필터 초기화
            </Button>
          </div>
        )}
      </div>

      <DataTable
        columns={columnsConfig}
        data={shipmentsResponse?.data ?? []}
        isLoading={shipmentsLoading}
      />

      {shipmentsResponse && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            총 {shipmentsResponse.total}건 중 {shipmentsResponse.offset + 1} -{" "}
            {Math.min(
              shipmentsResponse.offset + shipmentsResponse.limit,
              shipmentsResponse.total,
            )}
            건 표시
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={searchParams.offset === 0}
              onClick={() =>
                setSearchParams((prev) => ({
                  ...prev,
                  offset: Math.max(0, (prev.offset ?? 0) - (prev.limit ?? 20)),
                }))
              }
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={
                (searchParams.offset ?? 0) + (searchParams.limit ?? 20) >=
                shipmentsResponse.total
              }
              onClick={() =>
                setSearchParams((prev) => ({
                  ...prev,
                  offset: (prev.offset ?? 0) + (prev.limit ?? 20),
                }))
              }
            >
              다음
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
