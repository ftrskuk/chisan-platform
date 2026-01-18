"use client";

import { Package, MapPin, Scale, Ruler, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import type { Stock, Item, PaperType, Brand } from "@repo/shared";

type ParentStockType = Stock & {
  item: Item & { paperType: PaperType; brand: Brand | null };
};

interface ParentStockCardProps {
  stock: ParentStockType;
}

export function ParentStockCard({ stock }: ParentStockCardProps) {
  const item = stock.item;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">원지 정보</CardTitle>
          <StatusBadge variant={stock.condition} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 text-sm">
          <div className="flex items-start gap-3">
            <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-muted-foreground text-xs">품목</p>
              <p className="font-medium">
                {item.paperType.nameKo ?? item.paperType.nameEn} {item.grammage}
                g
              </p>
              <p className="text-xs text-muted-foreground">
                {item.brand?.name ?? "브랜드 없음"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Ruler className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">폭</p>
                <p className="font-medium">{stock.widthMm} mm</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Scale className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">수량 / 중량</p>
                <p className="font-medium">
                  {stock.quantity}개 / {stock.weightKg?.toLocaleString() ?? "-"}{" "}
                  kg
                </p>
              </div>
            </div>
          </div>

          {stock.batchNumber && (
            <div className="flex items-start gap-3">
              <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground text-xs">배치번호</p>
                <p className="font-mono text-sm">{stock.batchNumber}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 pt-2 border-t">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground text-xs">상태</p>
              <div className="mt-1">
                <StatusBadge variant={stock.status} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
