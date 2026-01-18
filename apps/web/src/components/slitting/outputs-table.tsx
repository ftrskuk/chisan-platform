"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SlittingOutputWithRelations } from "@repo/shared";

interface OutputsTableProps {
  outputs: SlittingOutputWithRelations[];
}

export function OutputsTable({ outputs }: OutputsTableProps) {
  const totalQuantity = outputs.reduce((sum, o) => sum + o.quantity, 0);
  const totalWeight = outputs.reduce((sum, o) => sum + (o.weightKg ?? 0), 0);
  const lossCount = outputs.filter((o) => o.isLoss).length;
  const lossQuantity = outputs
    .filter((o) => o.isLoss)
    .reduce((sum, o) => sum + o.quantity, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">산출물 목록</CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              총{" "}
              <span className="font-medium text-foreground">
                {outputs.length}
              </span>
              건
            </span>
            <span>
              수량{" "}
              <span className="font-medium text-foreground">
                {totalQuantity}
              </span>
              개
            </span>
            <span>
              중량{" "}
              <span className="font-medium text-foreground">
                {totalWeight.toLocaleString()}
              </span>
              kg
            </span>
            {lossCount > 0 && (
              <span className="text-amber-600">
                손실 <span className="font-medium">{lossQuantity}</span>개
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>품목</TableHead>
                <TableHead className="text-right">폭 (mm)</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead className="text-right">중량 (kg)</TableHead>
                <TableHead>구분</TableHead>
                <TableHead>비고</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outputs.map((output, index) => (
                <TableRow key={output.id}>
                  <TableCell className="font-mono text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {output.item.paperType.nameKo ??
                          output.item.paperType.nameEn}{" "}
                        {output.item.grammage}g
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {output.item.brand?.name ?? "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {output.widthMm}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {output.quantity}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {output.weightKg?.toLocaleString() ?? "-"}
                  </TableCell>
                  <TableCell>
                    {output.isLoss ? (
                      <Badge variant="destructive" className="text-xs">
                        손실
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        정상
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {output.notes ?? "-"}
                  </TableCell>
                </TableRow>
              ))}
              {outputs.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    산출물이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
