"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { useSlittingJob } from "@/hooks/api";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JobInfoCard } from "@/components/slitting/job-info-card";
import { ParentStockCard } from "@/components/slitting/parent-stock-card";
import { JobActionBar } from "@/components/slitting/job-action-bar";
import { OutputsTable } from "@/components/slitting/outputs-table";
import { CompleteJobForm } from "@/components/slitting/complete-job-form";
import { JobStatusBadge } from "@/components/slitting/job-status-badge";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;

  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

  const { data: job, isLoading, error } = useSlittingJob(jobId);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/production/slitting/jobs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <PageHeader title="오류" description="작업을 불러올 수 없습니다." />
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
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-16" />
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const showOutputs = job.status === "completed" || job.status === "approved";

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href={`/production/slitting/${job.scheduleId}`}>
          <Button variant="ghost" size="icon" className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={`작업 #${job.sequenceNumber}`}
          description={`일정: ${job.schedule.scheduleNumber}`}
          action={<JobStatusBadge status={job.status} className="text-base" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <JobInfoCard job={job} />
        <ParentStockCard stock={job.parentStock} />
      </div>

      <JobActionBar
        job={job}
        onCompleteClick={() => setIsCompleteDialogOpen(true)}
      />

      {showOutputs && job.outputs.length > 0 && (
        <OutputsTable outputs={job.outputs} />
      )}

      <Dialog
        open={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>작업 완료</DialogTitle>
            <DialogDescription>
              슬리팅 작업 결과를 입력하세요. 산출물 정보를 모두 입력한 후 완료
              버튼을 누르세요.
            </DialogDescription>
          </DialogHeader>
          <CompleteJobForm
            job={job}
            onSuccess={() => setIsCompleteDialogOpen(false)}
            onCancel={() => setIsCompleteDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
