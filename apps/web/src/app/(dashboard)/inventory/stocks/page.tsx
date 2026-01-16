"use client";

import { useState } from "react";
import { useStocks, useWarehouses, useItems } from "@/hooks/api";
import { DataTable } from "@/components/data-table";
import { stockColumns } from "@/components/stocks/stock-columns";
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
import type {
  StockSearchInput,
  StockCondition,
  StockStatus,
} from "@repo/shared";

export default function StocksPage() {
  const [searchParams, setSearchParams] = useState<StockSearchInput>({
    limit: 20,
    offset: 0,
  });

  const { data: stocksResponse, isLoading: stocksLoading } =
    useStocks(searchParams);
  const { data: warehouses } = useWarehouses();
  const { data: items } = useItems();

  const handleFilterChange = (
    key: keyof StockSearchInput,
    value: string | undefined,
  ) => {
    setSearchParams((prev: StockSearchInput) => ({
      ...prev,
      [key]: value === "" || value === "all" ? undefined : value,
      offset: 0,
    }));
  };

  const handleSearch = (value: string) => {
    setSearchParams((prev: StockSearchInput) => ({
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
    searchParams.warehouseId ||
    searchParams.itemId ||
    searchParams.condition ||
    searchParams.status ||
    searchParams.q;

  const warehouseOptions =
    warehouses?.map((w) => ({
      label: w.name,
      value: w.id,
    })) ?? [];

  const itemOptions =
    items?.map((i) => ({
      label: `${i.itemCode} - ${i.displayName}`,
      value: i.id,
    })) ?? [];

  const conditionOptions: { label: string; value: StockCondition }[] = [
    { label: "원지", value: "parent" },
    { label: "슬리팅", value: "slitted" },
  ];

  const statusOptions: { label: string; value: StockStatus }[] = [
    { label: "가용", value: "available" },
    { label: "예약", value: "reserved" },
    { label: "격리", value: "quarantine" },
    { label: "폐기", value: "disposed" },
  ];

  const columnsConfig = stockColumns();

  return (
    <div className="space-y-6">
      <PageHeader
        title="재고 조회"
        description="창고별/품목별 재고 현황을 조회합니다."
      />

      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>검색</Label>
            <Input
              placeholder="품목 코드/품목명 검색..."
              value={searchParams.q ?? ""}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>창고</Label>
            <Select
              value={searchParams.warehouseId ?? "all"}
              onValueChange={(value) =>
                handleFilterChange("warehouseId", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {warehouseOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>품목</Label>
            <Select
              value={searchParams.itemId ?? "all"}
              onValueChange={(value) => handleFilterChange("itemId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {itemOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>유형</Label>
            <Select
              value={searchParams.condition ?? "all"}
              onValueChange={(value) => handleFilterChange("condition", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {conditionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>재고 상태</Label>
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
        data={stocksResponse?.data ?? []}
        isLoading={stocksLoading}
      />

      {stocksResponse && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            총 {stocksResponse.total}건 중 {stocksResponse.offset + 1} -{" "}
            {Math.min(
              stocksResponse.offset + stocksResponse.limit,
              stocksResponse.total,
            )}
            건 표시
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={searchParams.offset === 0}
              onClick={() =>
                setSearchParams((prev: StockSearchInput) => ({
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
                stocksResponse.total
              }
              onClick={() =>
                setSearchParams((prev: StockSearchInput) => ({
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
