"use client";

import Link from "next/link";
import { ChevronRight, Package, Ruler, Layers } from "lucide-react";
import type { SlittingJobWithRelations } from "@repo/shared";
import { Card, CardContent } from "@/components/ui/card";
import { JobStatusBadge } from "@/components/slitting/job-status-badge";

interface WorkerJobCardProps {
  job: SlittingJobWithRelations;
}

export function WorkerJobCard({ job }: WorkerJobCardProps) {
  const completedRolls =
    job.jobRolls?.filter((r) => r.status === "completed").length ?? 0;
  const totalRolls = job.plannedRollCount ?? 0;
  const itemName = job.item
    ? `${job.item.paperType.nameKo ?? job.item.paperType.nameEn} ${job.item.grammage}g`
    : "-";

  return (
    <Link href={`/production/slitting/worker/${job.id}`}>
      <Card className="transition-colors hover:bg-muted/50 active:bg-muted">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  작업 #{job.sequenceNumber}
                </span>
                <JobStatusBadge status={job.status} />
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="h-4 w-4 shrink-0" />
                  <span className="truncate">{itemName}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Ruler className="h-4 w-4 shrink-0" />
                    <span>{job.parentWidthMm ?? "-"}mm</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Layers className="h-4 w-4 shrink-0" />
                    <span>
                      {completedRolls}/{totalRolls} 롤
                    </span>
                  </div>
                </div>
              </div>

              {job.plannedOutputs && job.plannedOutputs.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  계획: {job.plannedOutputs.length}종,{" "}
                  {job.plannedOutputs.reduce((sum, p) => sum + p.quantity, 0)}개
                </div>
              )}
            </div>

            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
