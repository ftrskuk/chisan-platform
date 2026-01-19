"use client";

import { Package, AlertTriangle } from "lucide-react";
import type { SlittingActualOutputWithRelations } from "@repo/shared";

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

interface ActualOutputsTableV2Props {
  actualOutputs: SlittingActualOutputWithRelations[];
  groupByRoll?: boolean;
}

export function ActualOutputsTableV2({
  actualOutputs,
  groupByRoll = false,
}: ActualOutputsTableV2Props) {
  if (!actualOutputs || actualOutputs.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            실제 산출물
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-6">
            아직 기록된 산출물이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalQuantity = actualOutputs.reduce((sum, o) => sum + o.quantity, 0);
  const totalWeight = actualOutputs.reduce(
    (sum, o) => sum + (o.weightKg ?? 0),
    0,
  );
  const lossOutputs = actualOutputs.filter((o) => o.isLoss);
  const lossQuantity = lossOutputs.reduce((sum, o) => sum + o.quantity, 0);
  const lossWeight = lossOutputs.reduce((sum, o) => sum + (o.weightKg ?? 0), 0);

  const outputsByRollId = actualOutputs.reduce<
    Record<string, SlittingActualOutputWithRelations[]>
  >((acc, output) => {
    const rollId = output.jobRollId ?? "no-roll";
    if (!acc[rollId]) {
      acc[rollId] = [];
    }
    acc[rollId].push(output);
    return acc;
  }, {});

  const groupedOutputs = groupByRoll ? outputsByRollId : { all: actualOutputs };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4" />
          실제 산출물
          <span className="text-muted-foreground font-normal text-sm ml-auto">
            {actualOutputs.length}건 / {totalQuantity}개 /{" "}
            {totalWeight.toLocaleString()}kg
            {lossQuantity > 0 && (
              <span className="text-amber-600 ml-2">
                (손실: {lossQuantity}개, {lossWeight.toLocaleString()}kg)
              </span>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Object.entries(groupedOutputs).map(([rollId, outputs], groupIndex) => (
          <div key={rollId} className={groupIndex > 0 ? "mt-6" : ""}>
            {groupByRoll && rollId !== "all" && (
              <div className="mb-2 text-sm font-medium text-muted-foreground">
                {rollId === "no-roll" ? (
                  "롤 미지정"
                ) : (
                  <>롤 #{outputs[0]?.jobRoll?.sequenceNumber ?? "?"}</>
                )}
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>품목</TableHead>
                  <TableHead className="text-right">폭 (mm)</TableHead>
                  <TableHead className="text-right">수량</TableHead>
                  <TableHead className="text-right">중량 (kg)</TableHead>
                  <TableHead>기록일시</TableHead>
                  <TableHead>비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outputs.map((output) => (
                  <TableRow
                    key={output.id}
                    className={output.isLoss ? "bg-amber-50/50" : ""}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {output.isLoss && (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {formatItemLabel(output.item)}
                          </span>
                          {output.item?.brand && (
                            <span className="text-xs text-muted-foreground">
                              {output.item.brand.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {output.widthMm.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {output.quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {output.weightKg?.toLocaleString() ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex flex-col">
                        <span>{formatKoDateTime(output.recordedAt)}</span>
                        {output.recordedByUser && (
                          <span className="text-xs">
                            {output.recordedByUser.displayName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {output.isLoss && (
                          <Badge variant="outline" className="text-amber-600">
                            손실
                          </Badge>
                        )}
                        {output.plannedOutput && (
                          <Badge variant="secondary" className="text-xs">
                            계획 #{output.plannedOutput.sequenceNumber}
                          </Badge>
                        )}
                        {output.notes && (
                          <span
                            className="text-muted-foreground text-sm truncate max-w-[150px]"
                            title={output.notes}
                          >
                            {output.notes}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
