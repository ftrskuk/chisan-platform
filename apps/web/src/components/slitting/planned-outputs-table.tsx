"use client";

import { ClipboardList } from "lucide-react";
import type { SlittingPlannedOutputWithRelations } from "@repo/shared";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PlannedOutputsTableProps {
  plannedOutputs: SlittingPlannedOutputWithRelations[];
}

export function PlannedOutputsTable({
  plannedOutputs,
}: PlannedOutputsTableProps) {
  if (!plannedOutputs || plannedOutputs.length === 0) {
    return null;
  }

  const totalQuantity = plannedOutputs.reduce((sum, o) => sum + o.quantity, 0);
  const totalWidthUsed = plannedOutputs.reduce(
    (sum, o) => sum + o.widthMm * o.quantity,
    0,
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4" />
          계획 산출물
          <span className="text-muted-foreground font-normal text-sm ml-auto">
            {plannedOutputs.length}종 / {totalQuantity}개
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>품목</TableHead>
              <TableHead className="text-right">폭 (mm)</TableHead>
              <TableHead className="text-right">수량</TableHead>
              <TableHead>비고</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plannedOutputs.map((output) => (
              <TableRow key={output.id}>
                <TableCell className="font-mono text-muted-foreground">
                  {output.sequenceNumber}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {output.item?.paperType?.nameKo ??
                        output.item?.paperType?.nameEn ??
                        "-"}{" "}
                      {output.item?.grammage}g
                    </span>
                    {output.item?.brand && (
                      <span className="text-xs text-muted-foreground">
                        {output.item.brand.name}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {output.widthMm.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {output.quantity}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {output.notes ?? "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-3 pt-3 border-t flex justify-end gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">폭 합계: </span>
            <span className="font-medium font-mono">
              {totalWidthUsed.toLocaleString()} mm
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">총 수량: </span>
            <span className="font-medium font-mono">{totalQuantity}개</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
