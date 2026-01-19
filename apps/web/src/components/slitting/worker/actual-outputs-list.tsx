"use client";

import { AlertTriangle, Edit2 } from "lucide-react";
import type { SlittingActualOutputWithRelations } from "@repo/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ActualOutputsListProps {
  outputs: SlittingActualOutputWithRelations[];
  onEdit?: (outputId: string) => void;
}

export function ActualOutputsList({ outputs, onEdit }: ActualOutputsListProps) {
  if (outputs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        기록된 산출물이 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {outputs.map((output, index) => (
        <div
          key={output.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                #{index + 1} {output.item.displayName}
              </span>
              {output.isLoss && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  손실
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{output.widthMm}mm</span>
              <span>{output.quantity}개</span>
              {output.weightKg && <span>{output.weightKg}kg</span>}
              {output.lengthM && <span>{output.lengthM}m</span>}
            </div>
          </div>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(output.id)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
