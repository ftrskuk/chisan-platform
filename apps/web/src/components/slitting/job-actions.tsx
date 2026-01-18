"use client";

import { useState } from "react";
import { MoreHorizontal, Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStartSlittingJob } from "@/hooks/api";
import type { SlittingJobWithRelations } from "@repo/shared";
import { toast } from "sonner";

interface JobActionsProps {
  job: SlittingJobWithRelations;
}

export function JobActions({ job }: JobActionsProps) {
  const { mutate: startJob, isPending: isStarting } = useStartSlittingJob();
  const [isOpen, setIsOpen] = useState(false);

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
          console.error(error);
        },
      },
    );
  };

  const handleComplete = () => {
    toast.info("작업 완료 기능은 상세 페이지에서 제공됩니다.");
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
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(job.id)}>
          ID 복사
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {job.status === "ready" && (
          <DropdownMenuItem onClick={handleStart} disabled={isStarting}>
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
