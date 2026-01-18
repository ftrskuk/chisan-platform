"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobStatusBadge } from "./job-status-badge";
import type { SlittingJobWithRelations } from "@repo/shared";

interface JobInfoCardProps {
  job: SlittingJobWithRelations;
}

export function JobInfoCard({ job }: JobInfoCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">작업 정보</CardTitle>
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
          <div className="flex justify-between">
            <dt className="text-muted-foreground">작업자</dt>
            <dd>
              {job.operator?.displayName ?? job.operator?.email ?? "미지정"}
            </dd>
          </div>
          {job.startedAt && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">시작시간</dt>
              <dd>{new Date(job.startedAt).toLocaleString("ko-KR")}</dd>
            </div>
          )}
          {job.completedAt && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">완료시간</dt>
              <dd>{new Date(job.completedAt).toLocaleString("ko-KR")}</dd>
            </div>
          )}
          {job.approvedAt && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">승인시간</dt>
              <dd>{new Date(job.approvedAt).toLocaleString("ko-KR")}</dd>
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
            <dd>{new Date(job.createdAt).toLocaleString("ko-KR")}</dd>
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
