"use client";

import { useMemo } from "react";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type {
  SlittingPlannedOutputWithRelations,
  SlittingActualOutputWithRelations,
} from "@repo/shared";

import { formatItemLabel } from "@/lib/slitting-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface VarianceAnalysisCardProps {
  plannedOutputs: SlittingPlannedOutputWithRelations[];
  actualOutputs: SlittingActualOutputWithRelations[];
}

interface VarianceRow {
  plannedOutputId: string;
  itemName: string;
  plannedWidthMm: number;
  plannedQuantity: number;
  actualQuantity: number;
  actualWeightKg: number;
  lossQuantity: number;
  quantityVariance: number;
  variancePercent: number;
}

export function VarianceAnalysisCard({
  plannedOutputs,
  actualOutputs,
}: VarianceAnalysisCardProps) {
  const { varianceData, totalVariance, totalVariancePercent } = useMemo(() => {
    if (!plannedOutputs || plannedOutputs.length === 0) {
      return {
        varianceData: [],
        totalPlannedQty: 0,
        totalActualQty: 0,
        totalVariance: 0,
        totalVariancePercent: 0,
      };
    }

    const actualsByPlannedId = new Map<
      string,
      SlittingActualOutputWithRelations[]
    >();
    for (const actual of actualOutputs) {
      if (actual.plannedOutputId) {
        const existing = actualsByPlannedId.get(actual.plannedOutputId) ?? [];
        existing.push(actual);
        actualsByPlannedId.set(actual.plannedOutputId, existing);
      }
    }

    const data: VarianceRow[] = plannedOutputs.map((planned) => {
      const matchingActuals = actualsByPlannedId.get(planned.id) ?? [];

      const actualQuantity = matchingActuals
        .filter((a) => !a.isLoss)
        .reduce((sum, a) => sum + a.quantity, 0);
      const actualWeightKg = matchingActuals
        .filter((a) => !a.isLoss)
        .reduce((sum, a) => sum + (a.weightKg ?? 0), 0);
      const lossQuantity = matchingActuals
        .filter((a) => a.isLoss)
        .reduce((sum, a) => sum + a.quantity, 0);

      const quantityVariance = actualQuantity - planned.quantity;
      const variancePercent =
        planned.quantity > 0 ? (quantityVariance / planned.quantity) * 100 : 0;

      return {
        plannedOutputId: planned.id,
        itemName: formatItemLabel(planned.item),
        plannedWidthMm: planned.widthMm,
        plannedQuantity: planned.quantity,
        actualQuantity,
        actualWeightKg,
        lossQuantity,
        quantityVariance,
        variancePercent,
      };
    });

    const plannedQty = data.reduce((sum, v) => sum + v.plannedQuantity, 0);
    const actualQty = data.reduce((sum, v) => sum + v.actualQuantity, 0);
    const variance = actualQty - plannedQty;
    const variancePct = plannedQty > 0 ? (variance / plannedQty) * 100 : 0;

    return {
      varianceData: data,
      totalPlannedQty: plannedQty,
      totalActualQty: actualQty,
      totalVariance: variance,
      totalVariancePercent: variancePct,
    };
  }, [plannedOutputs, actualOutputs]);

  if (varianceData.length === 0) {
    return null;
  }

  const getVarianceIcon = (variance: number) => {
    if (variance > 0)
      return <TrendingUp className="h-3.5 w-3.5 text-green-600" />;
    if (variance < 0)
      return <TrendingDown className="h-3.5 w-3.5 text-red-600" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return "text-green-600";
    if (variance < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          계획 대비 실적 분석
          <span
            className={cn(
              "text-sm font-normal ml-auto",
              getVarianceColor(totalVariance),
            )}
          >
            총 차이: {totalVariance > 0 ? "+" : ""}
            {totalVariance}개 ({totalVariancePercent.toFixed(1)}%)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>품목</TableHead>
              <TableHead className="text-right">계획 폭</TableHead>
              <TableHead className="text-right">계획 수량</TableHead>
              <TableHead className="text-right">실제 수량</TableHead>
              <TableHead className="text-right">손실</TableHead>
              <TableHead className="text-right">차이</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {varianceData.map((row) => (
              <TableRow key={row.plannedOutputId}>
                <TableCell className="font-medium">{row.itemName}</TableCell>
                <TableCell className="text-right font-mono">
                  {row.plannedWidthMm.toLocaleString()} mm
                </TableCell>
                <TableCell className="text-right font-mono">
                  {row.plannedQuantity}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {row.actualQuantity}
                  {row.actualWeightKg > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({row.actualWeightKg.toLocaleString()}kg)
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {row.lossQuantity > 0 ? (
                    <span className="text-amber-600 font-mono">
                      {row.lossQuantity}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className={cn(
                      "flex items-center justify-end gap-1",
                      getVarianceColor(row.quantityVariance),
                    )}
                  >
                    {getVarianceIcon(row.quantityVariance)}
                    <span className="font-mono">
                      {row.quantityVariance > 0 ? "+" : ""}
                      {row.quantityVariance}
                    </span>
                    <span className="text-xs">
                      ({row.variancePercent.toFixed(1)}%)
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
