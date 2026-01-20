"use client";

import { useState } from "react";
import { useImportOrders, usePartners } from "@/hooks/api";
import { DataTable } from "@/components/data-table";
import { importOrderColumns } from "@/components/import/import-order-columns";
import { PageHeader } from "@/components/layout";
import { FormSheet } from "@/components/form-sheet";
import { ImportOrderForm } from "@/components/import/import-order-form";
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
import { Plus, X } from "lucide-react";
import type {
  ImportOrderSearchInput,
  ImportOrderStatus,
  Currency,
} from "@repo/shared";
import { IMPORT_ORDER_STATUSES, CURRENCIES } from "@repo/shared";
import {
  importOrderStatusLabels,
  currencyLabels,
} from "@/lib/constants/import-labels";

export default function ImportOrdersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchParams, setSearchParams] = useState<ImportOrderSearchInput>({
    limit: 20,
    offset: 0,
  });

  const { data: ordersResponse, isLoading: ordersLoading } =
    useImportOrders(searchParams);
  const { data: partners } = usePartners();

  const suppliers = partners?.filter(
    (p) => p.partnerType === "supplier" || p.partnerType === "both",
  );

  const handleFilterChange = (
    key: keyof ImportOrderSearchInput,
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
    searchParams.partnerId ||
    searchParams.currency ||
    searchParams.q;

  const statusOptions: { label: string; value: ImportOrderStatus }[] =
    IMPORT_ORDER_STATUSES.map((status) => ({
      label: importOrderStatusLabels[status],
      value: status,
    }));

  const currencyOptions: { label: string; value: Currency }[] = CURRENCIES.map(
    (currency) => ({
      label: currencyLabels[currency],
      value: currency,
    }),
  );

  const partnerOptions =
    suppliers?.map((p) => ({
      label: p.name,
      value: p.id,
    })) ?? [];

  const columnsConfig = importOrderColumns();

  return (
    <div className="space-y-6">
      <PageHeader
        title="수입 주문"
        description="수입 주문을 관리합니다."
        action={
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />새 수입 주문
          </Button>
        }
      />

      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>검색</Label>
            <Input
              placeholder="PO번호 검색..."
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
            <Label>공급업체</Label>
            <Select
              value={searchParams.partnerId ?? "all"}
              onValueChange={(value) => handleFilterChange("partnerId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {partnerOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>통화</Label>
            <Select
              value={searchParams.currency ?? "all"}
              onValueChange={(value) => handleFilterChange("currency", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {currencyOptions.map((option) => (
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
        data={ordersResponse?.data ?? []}
        isLoading={ordersLoading}
      />

      {ordersResponse && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            총 {ordersResponse.total}건 중 {ordersResponse.offset + 1} -{" "}
            {Math.min(
              ordersResponse.offset + ordersResponse.limit,
              ordersResponse.total,
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
                ordersResponse.total
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

      <FormSheet
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title="새 수입 주문 등록"
        description="수입 주문을 등록합니다."
      >
        <ImportOrderForm onSuccess={() => setIsFormOpen(false)} />
      </FormSheet>
    </div>
  );
}
