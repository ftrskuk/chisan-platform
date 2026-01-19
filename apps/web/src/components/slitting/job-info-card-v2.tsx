"use client";

import { Info, Layers } from "lucide-react";
import type { SlittingJobWithRelations } from "@repo/shared";

import {
  isV2SlittingJob,
  formatItemLabel,
  formatKoDateTimeFull,
} from "@/lib/slitting-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobStatusBadge } from "./job-status-badge";

interface JobInfoCardV2Props {
  job: SlittingJobWithRelations;
}

export function JobInfoCardV2({ job }: JobInfoCardV2Props) {
  const isV2Job = isV2SlittingJob(job);
  const registeredRolls = job.jobRolls?.length ?? 0;
  const completedRolls =
    job.jobRolls?.filter((r) => r.status === "completed").length ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Info className="h-4 w-4" />
            작업 정보
            {isV2Job && (
              <Badge variant="outline" className="ml-2">
                V2
              </Badge>
            )}
          </CardTitle>
          <JobStatusBadge status={job.status} />
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">작업순서</dt>
            <dd className="font-mono font-medium">#{job.sequenceNumber}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">기계</dt>
            <dd className="font-medium">{job.machine.name}</dd>
          </div>

          {isV2Job && (
            <>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">품목</dt>
                <dd className="font-medium">{formatItemLabel(job.item)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">원지 폭</dt>
                <dd className="font-mono">{job.parentWidthMm} mm</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />롤 진행
                </dt>
                <dd className="font-mono">
                  {completedRolls} / {registeredRolls} / {job.plannedRollCount}
                  <span className="text-muted-foreground text-xs ml-1">
                    (완료/등록/계획)
                  </span>
                </dd>
              </div>
            </>
          )}

          {!isV2Job && job.parentStock && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">원지</dt>
              <dd className="font-medium">
                {formatItemLabel(job.parentStock.item)}{" "}
                {job.parentStock.widthMm}
                mm
              </dd>
            </div>
          )}

          <div className="flex justify-between">
            <dt className="text-muted-foreground">작업자</dt>
            <dd>
              {job.operator?.displayName ?? job.operator?.email ?? "미지정"}
            </dd>
          </div>

          {job.startedAt && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">시작시간</dt>
              <dd>{formatKoDateTimeFull(job.startedAt)}</dd>
            </div>
          )}
          {job.completedAt && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">완료시간</dt>
              <dd>{formatKoDateTimeFull(job.completedAt)}</dd>
            </div>
          )}
          {job.approvedAt && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">승인시간</dt>
              <dd>{formatKoDateTimeFull(job.approvedAt)}</dd>
            </div>
          )}
          {job.approvedByUser && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">승인자</dt>
              <dd>
                {job.approvedByUser.displayName ?? job.approvedByUser.email}
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">생성일시</dt>
            <dd>{formatKoDateTimeFull(job.createdAt)}</dd>
          </div>
          {job.memo && (
            <div className="flex flex-col gap-1 pt-2 border-t">
              <dt className="text-muted-foreground">메모</dt>
              <dd className="text-foreground">{job.memo}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
