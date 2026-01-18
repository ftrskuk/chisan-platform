"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Play,
  CheckCircle2,
  Eye,
  ArrowRightCircle,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useMarkJobReady,
  useStartSlittingJob,
  useApproveSlittingJob,
} from "@/hooks/api";
import type { SlittingJobWithRelations } from "@repo/shared";
import { toast } from "sonner";

interface JobActionsProps {
  job: SlittingJobWithRelations;
}

export function JobActions({ job }: JobActionsProps) {
  const router = useRouter();
  const { mutate: markReady, isPending: isMarkingReady } = useMarkJobReady();
  const { mutate: startJob, isPending: isStarting } = useStartSlittingJob();
  const { mutate: approveJob, isPending: isApproving } =
    useApproveSlittingJob();
  const [isOpen, setIsOpen] = useState(false);

  const isLoading = isMarkingReady || isStarting || isApproving;

  const handleView = () => {
    router.push(`/production/slitting/jobs/${job.id}`);
    setIsOpen(false);
  };

  const handleMarkReady = () => {
    markReady(
      { id: job.id },
      {
        onSuccess: () => {
          toast.success("작업이 준비완료 상태로 변경되었습니다.");
          setIsOpen(false);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "상태 변경에 실패했습니다.",
          );
        },
      },
    );
  };

  const handleStart = () => {
    startJob(
      { id: job.id },
      {
        onSuccess: () => {
          toast.success("작업이 시작되었습니다.");
          setIsOpen(false);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "작업 시작에 실패했습니다.",
          );
        },
      },
    );
  };

  const handleComplete = () => {
    router.push(`/production/slitting/jobs/${job.id}`);
    setIsOpen(false);
  };

  const handleApprove = () => {
    approveJob(
      { id: job.id },
      {
        onSuccess: () => {
          toast.success("작업이 승인되었습니다. 산출물이 재고에 반영됩니다.");
          setIsOpen(false);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "승인에 실패했습니다.",
          );
        },
      },
    );
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">메뉴 열기</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>작업 관리</DropdownMenuLabel>

        <DropdownMenuItem onClick={handleView}>
          <Eye className="mr-2 h-4 w-4" />
          상세 보기
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(job.id)}>
          ID 복사
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {job.status === "pending" && (
          <DropdownMenuItem onClick={handleMarkReady} disabled={isLoading}>
            <ArrowRightCircle className="mr-2 h-4 w-4" />
            준비완료로 변경
          </DropdownMenuItem>
        )}

        {job.status === "ready" && (
          <DropdownMenuItem onClick={handleStart} disabled={isLoading}>
            <Play className="mr-2 h-4 w-4" />
            작업 시작
          </DropdownMenuItem>
        )}

        {job.status === "in_progress" && (
          <DropdownMenuItem onClick={handleComplete}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            작업 완료
          </DropdownMenuItem>
        )}

        {job.status === "completed" && (
          <DropdownMenuItem onClick={handleApprove} disabled={isLoading}>
            <ClipboardCheck className="mr-2 h-4 w-4" />
            승인
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
