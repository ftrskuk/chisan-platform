"use client";

import { Package } from "lucide-react";
import type { SlittingJobRollWithRelations } from "@repo/shared";

import { formatKoDateTime, formatItemLabel } from "@/lib/slitting-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { JobRollStatusBadge } from "./job-roll-status-badge";

interface JobRollsTableProps {
  jobRolls: SlittingJobRollWithRelations[];
  plannedRollCount?: number;
}

export function JobRollsTable({
  jobRolls,
  plannedRollCount,
}: JobRollsTableProps) {
  if (!jobRolls || jobRolls.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            등록된 롤
            <span className="text-muted-foreground font-normal text-sm ml-auto">
              0 / {plannedRollCount ?? "?"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-6">
            아직 등록된 롤이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const completedRolls = jobRolls.filter(
    (r) => r.status === "completed",
  ).length;
  const inProgressRolls = jobRolls.filter(
    (r) => r.status === "in_progress",
  ).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4" />
          등록된 롤
          <span className="text-muted-foreground font-normal text-sm ml-auto">
            {jobRolls.length} / {plannedRollCount ?? "?"} (완료:{" "}
            {completedRolls}
            {inProgressRolls > 0 && `, 진행중: ${inProgressRolls}`})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>재고 정보</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>등록</TableHead>
              <TableHead>시작</TableHead>
              <TableHead>완료</TableHead>
              <TableHead>산출물</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobRolls.map((roll) => {
              const stock = roll.stock;
              const item = stock?.item;
              const outputCount = roll.actualOutputs?.length ?? 0;

              return (
                <TableRow key={roll.id}>
                  <TableCell className="font-mono text-muted-foreground">
                    {roll.sequenceNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {formatItemLabel(item)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {stock?.widthMm}mm |{" "}
                        {stock?.weightKg?.toLocaleString() ?? "-"}kg
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <JobRollStatusBadge status={roll.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex flex-col">
                      <span>{formatKoDateTime(roll.registeredAt)}</span>
                      <span className="text-xs">
                        {roll.registeredByUser?.displayName ?? "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatKoDateTime(roll.startedAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatKoDateTime(roll.completedAt)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {outputCount > 0 ? (
                      <Badge variant="outline">{outputCount}개</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
