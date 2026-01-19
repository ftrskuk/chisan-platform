"use client";

import { Package, Play, CheckCircle, XCircle } from "lucide-react";
import type { SlittingJobRollWithRelations } from "@repo/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JobRollStatusBadge } from "@/components/slitting/job-roll-status-badge";

interface RollStatusCardProps {
  roll: SlittingJobRollWithRelations;
  onStart?: () => void;
  onRecordOutput?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  isActionPending?: boolean;
}

export function RollStatusCard({
  roll,
  onStart,
  onRecordOutput,
  onComplete,
  onCancel,
  isActionPending,
}: RollStatusCardProps) {
  const outputCount = roll.actualOutputs?.length ?? 0;
  const stockInfo = roll.stock;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">롤 #{roll.sequenceNumber}</span>
              <JobRollStatusBadge status={roll.status} />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {stockInfo.batchNumber ?? stockInfo.id.slice(0, 8)}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <span>{stockInfo.widthMm}mm</span>
              <span>{stockInfo.weightKg?.toLocaleString() ?? "-"}kg</span>
            </div>

            {roll.status === "in_progress" && (
              <div className="text-xs text-muted-foreground">
                산출물 기록: {outputCount}건
              </div>
            )}

            {roll.status === "completed" && roll.completedAt && (
              <div className="text-xs text-muted-foreground">
                완료: {new Date(roll.completedAt).toLocaleTimeString("ko-KR")}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {roll.status === "registered" && onStart && (
              <Button size="sm" onClick={onStart} disabled={isActionPending}>
                <Play className="mr-1 h-4 w-4" />
                시작
              </Button>
            )}

            {roll.status === "in_progress" && (
              <>
                {onRecordOutput && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRecordOutput}
                    disabled={isActionPending}
                  >
                    <Package className="mr-1 h-4 w-4" />
                    산출물
                  </Button>
                )}
                {onComplete && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={onComplete}
                    disabled={isActionPending}
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    완료
                  </Button>
                )}
                {onCancel && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={onCancel}
                    disabled={isActionPending}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    취소
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
