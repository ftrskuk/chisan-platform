"use client";

import { useState } from "react";
import { useSlittingJobs, useMachines, useUsers } from "@/hooks/api";
import { DataTable } from "@/components/data-table";
import { jobColumns } from "@/components/slitting/job-columns";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { JobSearchInput, JobStatus } from "@repo/shared";
import { JOB_STATUSES } from "@repo/shared";
import {
  jobStatusLabels,
  JOBS_DEFAULT_FILTER_STATUSES,
} from "@/lib/constants/slitting-labels";

export default function SlittingJobsPage() {
  const [searchParams, setSearchParams] = useState<JobSearchInput>({
    limit: 20,
    offset: 0,
    statuses: JOBS_DEFAULT_FILTER_STATUSES,
  });

  const { data: jobsResponse, isLoading } = useSlittingJobs(searchParams);
  const { data: machinesResponse } = useMachines();
  const { data: users } = useUsers();

  const handleFilterChange = (key: keyof JobSearchInput, value: unknown) => {
    setSearchParams((prev) => ({
      ...prev,
      [key]: value === "" || value === "all" ? undefined : value,
      offset: 0,
    }));
  };

  const handleStatusChange = (value: string) => {
    if (value === "all") {
      setSearchParams((prev) => ({
        ...prev,
        status: undefined,
        statuses: undefined,
        offset: 0,
      }));
    } else {
      setSearchParams((prev) => ({
        ...prev,
        status: value as JobStatus,
        statuses: undefined,
        offset: 0,
      }));
    }
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
      statuses: JOBS_DEFAULT_FILTER_STATUSES,
    });
  };

  const hasActiveFilters =
    searchParams.status ||
    searchParams.machineId ||
    searchParams.operatorId ||
    searchParams.q ||
    (searchParams.statuses &&
      searchParams.statuses.length !== JOBS_DEFAULT_FILTER_STATUSES.length);

  const statusOptions: { label: string; value: JobStatus }[] = JOB_STATUSES.map(
    (status) => ({
      label: jobStatusLabels[status],
      value: status,
    }),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="작업 실행 대기열"
        description="실행 대기 중이거나 진행 중인 슬리팅 작업을 관리합니다."
      />

      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>검색</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="일정/작업번호 검색..."
                value={searchParams.q ?? ""}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>기계</Label>
            <Select
              value={searchParams.machineId ?? "all"}
              onValueChange={(value) => handleFilterChange("machineId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {machinesResponse?.data.map((machine) => (
                  <SelectItem key={machine.id} value={machine.id}>
                    {machine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>작업자</Label>
            <Select
              value={searchParams.operatorId ?? "all"}
              onValueChange={(value) => handleFilterChange("operatorId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>상태</Label>
            <Select
              value={searchParams.status ?? "all"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="진행중/대기 (기본)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">진행중/대기 (기본)</SelectItem>
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
        columns={jobColumns()}
        data={jobsResponse?.data ?? []}
        isLoading={isLoading}
      />

      {jobsResponse && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            총 {jobsResponse.total}건 중 {jobsResponse.offset + 1} -{" "}
            {Math.min(
              jobsResponse.offset + jobsResponse.limit,
              jobsResponse.total,
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
                jobsResponse.total
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
