"use client";

import { useState } from "react";
import { useOrders, usePartners } from "@/hooks/api";
import { DataTable } from "@/components/data-table";
import { orderColumns } from "@/components/orders/order-columns";
import { PageHeader } from "@/components/layout";
import { FormSheet } from "@/components/form-sheet";
import { OrderForm } from "@/components/orders/order-form";
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
import type { OrderSearchInput, OrderType, OrderStatus } from "@repo/shared";
import { ORDER_STATUSES } from "@repo/shared";
import { typeLabels, orderStatusLabels } from "@/lib/constants/order-labels";

export default function OrdersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchParams, setSearchParams] = useState<OrderSearchInput>({
    limit: 20,
    offset: 0,
  });

  const { data: ordersResponse, isLoading: ordersLoading } =
    useOrders(searchParams);
  const { data: partners } = usePartners();

  const handleFilterChange = (
    key: keyof OrderSearchInput,
    value: string | undefined,
  ) => {
    setSearchParams((prev: OrderSearchInput) => ({
      ...prev,
      [key]: value === "" || value === "all" ? undefined : value,
      offset: 0,
    }));
  };

  const handleSearch = (value: string) => {
    setSearchParams((prev: OrderSearchInput) => ({
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
    searchParams.type ||
    searchParams.status ||
    searchParams.partnerId ||
    searchParams.isUrgent !== undefined ||
    searchParams.q;

  const typeOptions: { label: string; value: OrderType }[] = [
    { label: typeLabels.stock_in, value: "stock_in" },
    { label: typeLabels.stock_out, value: "stock_out" },
  ];

  const statusOptions: { label: string; value: OrderStatus }[] =
    ORDER_STATUSES.map((status) => ({
      label: orderStatusLabels[status],
      value: status,
    }));

  const partnerOptions =
    partners?.map((p) => ({
      label: p.name,
      value: p.id,
    })) ?? [];

  const columnsConfig = orderColumns();

  return (
    <div className="space-y-6">
      <PageHeader
        title="주문 목록"
        description="입고/출고 주문을 관리합니다."
        action={
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />새 주문
          </Button>
        }
      />

      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>검색</Label>
            <Input
              placeholder="주문번호 검색..."
              value={searchParams.q ?? ""}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>유형</Label>
            <Select
              value={searchParams.type ?? "all"}
              onValueChange={(value) => handleFilterChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label>거래처</Label>
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
            <Label>긴급</Label>
            <Select
              value={
                searchParams.isUrgent === undefined
                  ? "all"
                  : searchParams.isUrgent
                    ? "true"
                    : "false"
              }
              onValueChange={(value) => {
                if (value === "all") {
                  handleFilterChange("isUrgent", undefined);
                } else {
                  setSearchParams((prev) => ({
                    ...prev,
                    isUrgent: value === "true",
                    offset: 0,
                  }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="true">긴급만</SelectItem>
                <SelectItem value="false">일반만</SelectItem>
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
                setSearchParams((prev: OrderSearchInput) => ({
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
                setSearchParams((prev: OrderSearchInput) => ({
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
        title="새 주문 등록"
        description="입고 또는 출고 주문을 등록합니다."
      >
        <OrderForm onSuccess={() => setIsFormOpen(false)} />
      </FormSheet>
    </div>
  );
}
