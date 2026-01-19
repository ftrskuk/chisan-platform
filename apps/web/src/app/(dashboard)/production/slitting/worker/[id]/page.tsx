"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Package, Ruler, Layers, Plus } from "lucide-react";
import { toast } from "sonner";

import { useWorkerJob, useStartRoll } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { JobStatusBadge } from "@/components/slitting/job-status-badge";
import { RollRegisterForm } from "@/components/slitting/worker/roll-register-form";
import { RollStatusCard } from "@/components/slitting/worker/roll-status-card";
import { OutputRecordForm } from "@/components/slitting/worker/output-record-form";
import { RollCompleteForm } from "@/components/slitting/worker/roll-complete-form";
import { JobCompleteForm } from "@/components/slitting/worker/job-complete-form";
import { ActualOutputsList } from "@/components/slitting/worker/actual-outputs-list";

type SheetType = "register" | "output" | "completeRoll" | "completeJob" | null;

export default function WorkerJobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = params.id;

  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [selectedRollId, setSelectedRollId] = useState<string | null>(null);

  const { data: job, isLoading, error, refetch } = useWorkerJob(jobId);
  const startRoll = useStartRoll();

  const jobRolls = useMemo(() => job?.jobRolls ?? [], [job?.jobRolls]);
  const plannedOutputs = useMemo(
    () => job?.plannedOutputs ?? [],
    [job?.plannedOutputs],
  );

  const completedRolls = useMemo(
    () => jobRolls.filter((r) => r.status === "completed"),
    [jobRolls],
  );
  const inProgressRoll = useMemo(
    () => jobRolls.find((r) => r.status === "in_progress"),
    [jobRolls],
  );

  const canRegisterRoll =
    job &&
    (job.status === "ready" || job.status === "in_progress") &&
    jobRolls.length < (job.plannedRollCount ?? 1);

  const canCompleteJob =
    job &&
    job.status === "in_progress" &&
    !inProgressRoll &&
    completedRolls.length > 0;

  const handleStartRoll = async (rollId: string) => {
    try {
      await startRoll.mutateAsync({ jobId, rollId });
      toast.success("롤 작업을 시작했습니다.");
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "롤 시작에 실패했습니다.",
      );
    }
  };

  const openOutputSheet = (rollId: string) => {
    setSelectedRollId(rollId);
    setActiveSheet("output");
  };

  const openCompleteRollSheet = (rollId: string) => {
    setSelectedRollId(rollId);
    setActiveSheet("completeRoll");
  };

  const closeSheet = () => {
    setActiveSheet(null);
    setSelectedRollId(null);
    refetch();
  };

  if (error) {
    return (
      <div className="rounded-lg border bg-destructive/10 p-6 text-center text-destructive">
        {error instanceof Error ? error.message : "작업을 불러올 수 없습니다."}
      </div>
    );
  }

  if (isLoading || !job) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-24" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const itemName = job.item
    ? `${job.item.paperType.nameKo ?? job.item.paperType.nameEn} ${job.item.grammage}g`
    : "-";

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  작업 #{job.sequenceNumber}
                </span>
                <JobStatusBadge status={job.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                일정: {job.schedule.scheduleNumber}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">품목</p>
                <p className="font-medium">{itemName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">폭</p>
                <p className="font-medium">{job.parentWidthMm ?? "-"}mm</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">롤</p>
                <p className="font-medium">
                  {completedRolls.length}/{job.plannedRollCount ?? 1}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {plannedOutputs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">계획 산출물</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {plannedOutputs.map((planned) => (
              <div
                key={planned.id}
                className="flex justify-between text-sm py-1 border-b last:border-0"
              >
                <span>{planned.item.displayName}</span>
                <span className="text-muted-foreground">
                  {planned.widthMm}mm × {planned.quantity}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">롤 목록</h3>
          {canRegisterRoll && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveSheet("register")}
            >
              <Plus className="mr-1 h-4 w-4" />롤 등록
            </Button>
          )}
        </div>

        {jobRolls.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            등록된 롤이 없습니다
            <br />
            롤을 등록하여 작업을 시작하세요
          </div>
        ) : (
          <div className="space-y-3">
            {jobRolls.map((roll) => (
              <div key={roll.id} className="space-y-2">
                <RollStatusCard
                  roll={roll}
                  onStart={
                    roll.status === "registered" && !inProgressRoll
                      ? () => handleStartRoll(roll.id)
                      : undefined
                  }
                  onRecordOutput={
                    roll.status === "in_progress"
                      ? () => openOutputSheet(roll.id)
                      : undefined
                  }
                  onComplete={
                    roll.status === "in_progress"
                      ? () => openCompleteRollSheet(roll.id)
                      : undefined
                  }
                  isActionPending={startRoll.isPending}
                />
                {roll.status === "in_progress" &&
                  roll.actualOutputs &&
                  roll.actualOutputs.length > 0 && (
                    <div className="ml-4">
                      <ActualOutputsList outputs={roll.actualOutputs} />
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>

      {canCompleteJob && (
        <Button
          className="w-full"
          size="lg"
          onClick={() => setActiveSheet("completeJob")}
        >
          작업 완료
        </Button>
      )}

      <Sheet
        open={activeSheet === "register"}
        onOpenChange={(open) => !open && closeSheet()}
      >
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader>
            <SheetTitle>롤 등록</SheetTitle>
            <SheetDescription>작업할 원지 롤을 선택하세요</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <RollRegisterForm
              job={job}
              onSuccess={closeSheet}
              onCancel={closeSheet}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={activeSheet === "output"}
        onOpenChange={(open) => !open && closeSheet()}
      >
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>산출물 기록</SheetTitle>
            <SheetDescription>슬리팅 결과물을 기록하세요</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            {selectedRollId && (
              <OutputRecordForm
                jobId={jobId}
                rollId={selectedRollId}
                plannedOutputs={plannedOutputs}
                onSuccess={closeSheet}
                onCancel={closeSheet}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={activeSheet === "completeRoll"}
        onOpenChange={(open) => !open && closeSheet()}
      >
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>롤 완료</SheetTitle>
            <SheetDescription>롤 작업을 완료합니다</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            {selectedRollId && (
              <RollCompleteForm
                jobId={jobId}
                rollId={selectedRollId}
                outputCount={
                  jobRolls.find((r) => r.id === selectedRollId)?.actualOutputs
                    ?.length ?? 0
                }
                onSuccess={closeSheet}
                onCancel={closeSheet}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={activeSheet === "completeJob"}
        onOpenChange={(open) => !open && closeSheet()}
      >
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>작업 완료</SheetTitle>
            <SheetDescription>
              모든 롤 작업을 완료하고 작업을 마감합니다
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <JobCompleteForm
              jobId={jobId}
              completedRolls={completedRolls}
              onSuccess={() => {
                closeSheet();
                router.push("/production/slitting/worker");
              }}
              onCancel={closeSheet}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
