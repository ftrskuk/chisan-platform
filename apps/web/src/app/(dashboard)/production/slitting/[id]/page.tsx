"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Send } from "lucide-react";
import { toast } from "sonner";

import { useSlittingSchedule, usePublishSlittingSchedule } from "@/hooks/api";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/loading-button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormSheet } from "@/components/form-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ScheduleInfoCard } from "@/components/slitting/schedule-info-card";
import { scheduleJobColumns } from "@/components/slitting/schedule-job-columns";
import { JobForm } from "@/components/slitting/job-form";

export default function ScheduleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const scheduleId = params.id;

  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);

  const { data: schedule, isLoading, error } = useSlittingSchedule(scheduleId);
  const publishMutation = usePublishSlittingSchedule();

  const handlePublish = async () => {
    try {
      await publishMutation.mutateAsync({ id: scheduleId });
      toast.success("일정이 배포되었습니다.");
      setIsPublishDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "배포에 실패했습니다.");
    }
  };

  const canPublish =
    schedule?.status === "draft" && (schedule?.totalJobs ?? 0) > 0;
  const canAddJob = schedule?.status === "draft";

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/production/slitting">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <PageHeader title="오류" description="일정을 불러올 수 없습니다." />
        </div>
        <div className="rounded-lg border bg-destructive/10 p-6 text-center text-destructive">
          {error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다."}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!schedule) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/production/slitting">
          <Button variant="ghost" size="icon" className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={`일정 ${schedule.scheduleNumber}`}
          description={`예정일: ${new Date(schedule.scheduledDate).toLocaleDateString("ko-KR")}`}
          action={
            canPublish && (
              <LoadingButton
                onClick={() => setIsPublishDialogOpen(true)}
                loading={publishMutation.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                배포
              </LoadingButton>
            )
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ScheduleInfoCard schedule={schedule} />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">작업 목록</h2>
            {canAddJob && (
              <Button onClick={() => setIsJobFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                작업 추가
              </Button>
            )}
          </div>

          <DataTable
            columns={scheduleJobColumns()}
            data={schedule.jobs ?? []}
            pageSize={10}
          />
        </div>
      </div>

      <FormSheet
        open={isJobFormOpen}
        onOpenChange={setIsJobFormOpen}
        title="작업 추가"
        description="새 슬리팅 작업을 추가합니다."
      >
        <JobForm
          scheduleId={scheduleId}
          onSuccess={() => setIsJobFormOpen(false)}
        />
      </FormSheet>

      <ConfirmDialog
        open={isPublishDialogOpen}
        onOpenChange={setIsPublishDialogOpen}
        title="일정 배포"
        description="배포 후에는 작업자가 작업을 시작할 수 있습니다. 계속하시겠습니까?"
        onConfirm={handlePublish}
        isLoading={publishMutation.isPending}
        confirmText="배포"
      />
    </div>
  );
}
