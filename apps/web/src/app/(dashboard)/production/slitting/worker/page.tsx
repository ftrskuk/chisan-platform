"use client";

import { useMemo, useState } from "react";
import { CalendarIcon, RefreshCw, Inbox } from "lucide-react";

import { useWorkerJobs, useMachines } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkerJobCard } from "@/components/slitting/worker/job-card";

function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateKorean(dateStr: string): string {
  const date = new Date(dateStr);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdays[date.getDay()]})`;
}

export default function WorkerJobsPage() {
  const today = formatDateToISO(new Date());
  const [selectedDate] = useState(today);
  const [selectedMachineId, setSelectedMachineId] = useState<string>("__all__");

  const {
    data: jobsResponse,
    isLoading,
    refetch,
    isFetching,
  } = useWorkerJobs({
    scheduledDate: selectedDate,
    statuses: ["ready", "in_progress"],
    machineId: selectedMachineId === "__all__" ? undefined : selectedMachineId,
    limit: 50,
    offset: 0,
  });

  const { data: machinesResponse } = useMachines();
  const machines = useMemo(
    () => machinesResponse?.data ?? [],
    [machinesResponse?.data],
  );

  const jobs = useMemo(() => jobsResponse?.data ?? [], [jobsResponse?.data]);

  const formattedDate = formatDateKorean(selectedDate);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          <span className="font-medium text-foreground">{formattedDate}</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      <Select value={selectedMachineId} onValueChange={setSelectedMachineId}>
        <SelectTrigger>
          <SelectValue placeholder="기계 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">전체 기계</SelectItem>
          {machines.map((machine) => (
            <SelectItem key={machine.id} value={machine.id}>
              {machine.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Inbox className="mb-3 h-12 w-12" />
          <p className="font-medium">오늘 작업이 없습니다</p>
          <p className="mt-1 text-sm">
            준비완료 또는 진행중인 작업이 표시됩니다
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <WorkerJobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      <div className="pt-4 text-center text-xs text-muted-foreground">
        {jobs.length}개의 작업
      </div>
    </div>
  );
}
