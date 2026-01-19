"use client";

import { Package, Building2, FileText } from "lucide-react";
import type { Item, PaperType, Brand } from "@repo/shared";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ItemWithRelations = Item & {
  paperType: PaperType;
  brand: Brand | null;
};

interface ItemInfoCardProps {
  item: ItemWithRelations;
  className?: string;
}

export function ItemInfoCard({ item, className }: ItemInfoCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4" />
          품목 정보
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">지종</p>
            <p className="font-medium">
              {item.paperType.nameKo ?? item.paperType.nameEn ?? "-"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">평량</p>
            <p className="font-medium">{item.grammage}g/m²</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">브랜드</p>
              <p className="font-medium">{item.brand?.name ?? "-"}</p>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">품목코드</p>
            <p className="font-mono text-sm">{item.itemCode ?? "-"}</p>
          </div>
        </div>

        {item.notes && (
          <div className="text-sm border-t pt-3">
            <div className="flex items-start gap-2">
              <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">메모</p>
                <p className="text-muted-foreground">{item.notes}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
