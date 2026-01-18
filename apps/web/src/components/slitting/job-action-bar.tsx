"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Play,
  ClipboardCheck,
  ArrowRightCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/loading-button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  useMarkJobReady,
  useStartSlittingJob,
  useApproveSlittingJob,
} from "@/hooks/api";
import type { SlittingJobWithRelations } from "@repo/shared";

interface JobActionBarProps {
  job: SlittingJobWithRelations;
  onCompleteClick: () => void;
}

export function JobActionBar({ job, onCompleteClick }: JobActionBarProps) {
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);

  const markReady = useMarkJobReady();
  const startJob = useStartSlittingJob();
  const approveJob = useApproveSlittingJob();

  const handleMarkReady = async () => {
    try {
      await markReady.mutateAsync({ id: job.id });
      toast.success("작업이 준비완료 상태로 변경되었습니다.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "상태 변경에 실패했습니다.",
      );
    }
  };

  const handleStart = async () => {
    try {
      await startJob.mutateAsync({ id: job.id });
      toast.success("작업이 시작되었습니다.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "작업 시작에 실패했습니다.",
      );
    }
  };

  const handleApprove = async () => {
    try {
      await approveJob.mutateAsync({ id: job.id });
      toast.success("작업이 승인되었습니다. 산출물이 재고에 반영됩니다.");
      setIsApproveDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "승인에 실패했습니다.",
      );
    }
  };

  const isAnyLoading =
    markReady.isPending || startJob.isPending || approveJob.isPending;

  return (
    <>
      <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
        <span className="text-sm font-medium text-muted-foreground">
          작업 진행:
        </span>

        {job.status === "pending" && (
          <LoadingButton
            onClick={handleMarkReady}
            loading={markReady.isPending}
            disabled={isAnyLoading}
            variant="outline"
          >
            <ArrowRightCircle className="mr-2 h-4 w-4" />
            준비완료로 변경
          </LoadingButton>
        )}

        {job.status === "ready" && (
          <LoadingButton
            onClick={handleStart}
            loading={startJob.isPending}
            disabled={isAnyLoading}
          >
            <Play className="mr-2 h-4 w-4" />
            작업 시작
          </LoadingButton>
        )}

        {job.status === "in_progress" && (
          <Button onClick={onCompleteClick} disabled={isAnyLoading}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            작업 완료
          </Button>
        )}

        {job.status === "completed" && (
          <Button
            onClick={() => setIsApproveDialogOpen(true)}
            disabled={isAnyLoading}
            variant="default"
          >
            <ClipboardCheck className="mr-2 h-4 w-4" />
            승인
          </Button>
        )}

        {job.status === "approved" && (
          <span className="text-sm text-emerald-600 font-medium">
            ✓ 승인 완료됨
          </span>
        )}
      </div>

      <ConfirmDialog
        open={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
        title="작업 승인"
        description="승인하면 산출물이 재고로 등록됩니다. 원지 재고는 차감됩니다. 계속하시겠습니까?"
        onConfirm={handleApprove}
        isLoading={approveJob.isPending}
        confirmText="승인"
      />
    </>
  );
}
