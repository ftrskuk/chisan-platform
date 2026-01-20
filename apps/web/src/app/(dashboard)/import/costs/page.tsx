"use client";

import { useState } from "react";
import { useImportCosts } from "@/hooks/api";
import { DataTable } from "@/components/data-table";
import { importCostColumns } from "@/components/import/import-cost-columns";
import { PageHeader } from "@/components/layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { ImportCostSearchInput, ImportCostType } from "@repo/shared";
import { IMPORT_COST_TYPES } from "@repo/shared";
import { importCostTypeLabels } from "@/lib/constants/import-labels";

export default function ImportCostsPage() {
  const [searchParams, setSearchParams] = useState<ImportCostSearchInput>({
    limit: 50,
    offset: 0,
  });

  const { data: costsResponse, isLoading } = useImportCosts(searchParams);

  const handleFilterChange = (
    key: keyof ImportCostSearchInput,
    value: string | boolean | undefined,
  ) => {
    setSearchParams((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
      offset: 0,
    }));
  };

  const clearFilters = () => {
    setSearchParams({
      limit: 50,
      offset: 0,
    });
  };

  const hasActiveFilters =
    searchParams.costType !== undefined || searchParams.isPaid !== undefined;

  const costTypeOptions: { label: string; value: ImportCostType }[] =
    IMPORT_COST_TYPES.map((costType) => ({
      label: importCostTypeLabels[costType],
      value: costType,
    }));

  const columnsConfig = importCostColumns();

  return (
    <div className="space-y-6">
      <PageHeader title="부대비용" description="수입 부대비용을 관리합니다." />

      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>비용 유형</Label>
            <Select
              value={searchParams.costType ?? "all"}
              onValueChange={(value) => handleFilterChange("costType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {costTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>결제 상태</Label>
            <Select
              value={
                searchParams.isPaid === undefined
                  ? "all"
                  : searchParams.isPaid
                    ? "paid"
                    : "unpaid"
              }
              onValueChange={(value) => {
                if (value === "all") {
                  handleFilterChange("isPaid", undefined);
                } else {
                  handleFilterChange("isPaid", value === "paid");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="paid">결제완료</SelectItem>
                <SelectItem value="unpaid">미결제</SelectItem>
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
        data={costsResponse?.data ?? []}
        isLoading={isLoading}
      />

      {costsResponse && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            총 {costsResponse.total}건 중 {(searchParams.offset ?? 0) + 1} -{" "}
            {Math.min(
              (searchParams.offset ?? 0) + (searchParams.limit ?? 50),
              costsResponse.total,
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
                  offset: Math.max(0, (prev.offset ?? 0) - (prev.limit ?? 50)),
                }))
              }
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={
                (searchParams.offset ?? 0) + (searchParams.limit ?? 50) >=
                costsResponse.total
              }
              onClick={() =>
                setSearchParams((prev) => ({
                  ...prev,
                  offset: (prev.offset ?? 0) + (prev.limit ?? 50),
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
