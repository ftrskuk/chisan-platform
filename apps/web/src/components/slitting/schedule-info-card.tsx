"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScheduleStatusBadge } from "./schedule-status-badge";
import type { SlittingScheduleWithRelations } from "@repo/shared";

interface ScheduleInfoCardProps {
  schedule: SlittingScheduleWithRelations;
}

export function ScheduleInfoCard({ schedule }: ScheduleInfoCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">일정 정보</CardTitle>
          <ScheduleStatusBadge status={schedule.status} />
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">일정번호</dt>
            <dd className="font-mono font-medium">{schedule.scheduleNumber}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">예정일</dt>
            <dd>
              {new Date(schedule.scheduledDate).toLocaleDateString("ko-KR")}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">생성자</dt>
            <dd>
              {schedule.createdByUser.displayName ??
                schedule.createdByUser.email}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">생성일시</dt>
            <dd>{new Date(schedule.createdAt).toLocaleString("ko-KR")}</dd>
          </div>
          {schedule.memo && (
            <div className="flex flex-col gap-1 pt-2 border-t">
              <dt className="text-muted-foreground">메모</dt>
              <dd className="text-foreground">{schedule.memo}</dd>
            </div>
          )}
        </dl>

        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            작업 현황
          </h4>
          <div className="grid grid-cols-5 gap-2 text-center">
            <div className="rounded-lg bg-gray-50 p-2">
              <div className="text-lg font-semibold">{schedule.totalJobs}</div>
              <div className="text-xs text-muted-foreground">전체</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-2">
              <div className="text-lg font-semibold text-gray-500">
                {schedule.pendingJobs}
              </div>
              <div className="text-xs text-muted-foreground">대기</div>
            </div>
            <div className="rounded-lg bg-blue-50 p-2">
              <div className="text-lg font-semibold text-blue-600">
                {schedule.readyJobs}
              </div>
              <div className="text-xs text-muted-foreground">준비</div>
            </div>
            <div className="rounded-lg bg-yellow-50 p-2">
              <div className="text-lg font-semibold text-yellow-600">
                {schedule.inProgressJobs}
              </div>
              <div className="text-xs text-muted-foreground">진행</div>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2">
              <div className="text-lg font-semibold text-emerald-600">
                {schedule.approvedJobs}
              </div>
              <div className="text-xs text-muted-foreground">승인</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
