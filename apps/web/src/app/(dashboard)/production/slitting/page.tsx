"use client";

import { useState } from "react";
import { useSlittingSchedules } from "@/hooks/api";
import { DataTable } from "@/components/data-table";
import { scheduleColumns } from "@/components/slitting/schedule-columns";
import { ScheduleForm } from "@/components/slitting/schedule-form";
import { PageHeader } from "@/components/layout";
import { FormSheet } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";
import { Plus, X, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScheduleSearchInput, ScheduleStatus } from "@repo/shared";
import { scheduleStatusLabels } from "@/lib/constants/slitting-labels";

export default function SlittingSchedulesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchParams, setSearchParams] = useState<ScheduleSearchInput>({
    limit: 20,
    offset: 0,
  });

  const { data: schedulesResponse, isLoading } =
    useSlittingSchedules(searchParams);

  const handleFilterChange = (
    key: keyof ScheduleSearchInput,
    value: unknown,
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
    searchParams.scheduledDateFrom ||
    searchParams.scheduledDateTo ||
    searchParams.q;

  const statusOptions: { label: string; value: ScheduleStatus }[] = [
    { label: scheduleStatusLabels.draft, value: "draft" },
    { label: scheduleStatusLabels.published, value: "published" },
    { label: scheduleStatusLabels.in_progress, value: "in_progress" },
    { label: scheduleStatusLabels.completed, value: "completed" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="슬리팅 일정 관리"
        description="일일 슬리팅 작업 일정을 관리합니다."
        action={
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />새 일정
          </Button>
        }
      />

      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>검색</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="일정번호 검색..."
                value={searchParams.q ?? ""}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
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
            <Label>시작일</Label>
            <Input
              type="date"
              value={searchParams.scheduledDateFrom ?? ""}
              onChange={(e) =>
                handleFilterChange("scheduledDateFrom", e.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>종료일</Label>
            <Input
              type="date"
              value={searchParams.scheduledDateTo ?? ""}
              onChange={(e) =>
                handleFilterChange("scheduledDateTo", e.target.value)
              }
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
        columns={scheduleColumns()}
        data={schedulesResponse?.data ?? []}
        isLoading={isLoading}
      />

      {schedulesResponse && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            총 {schedulesResponse.total}건 중 {schedulesResponse.offset + 1} -{" "}
            {Math.min(
              schedulesResponse.offset + schedulesResponse.limit,
              schedulesResponse.total,
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
                schedulesResponse.total
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
        title="새 슬리팅 일정"
        description="일일 슬리팅 작업 일정을 등록합니다."
      >
        <ScheduleForm onSuccess={() => setIsFormOpen(false)} />
      </FormSheet>
    </div>
  );
}
