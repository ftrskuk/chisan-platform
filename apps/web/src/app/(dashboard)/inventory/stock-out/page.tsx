"use client";

import { useState } from "react";
import { Minus } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { FormSheet } from "@/components/form-sheet";
import { StockOutForm } from "@/components/stocks/stock-out-form";
import { DataTable } from "@/components/data-table";
import { useStocks } from "@/hooks/api";
import { stockColumns } from "@/components/stocks/stock-columns";

export default function StockOutPage() {
  const [formOpen, setFormOpen] = useState(false);

  const { data: stocksResponse, isLoading } = useStocks({
    status: "available",
    isActive: true,
    limit: 20,
    offset: 0,
  });

  const handleFormSuccess = () => {
    setFormOpen(false);
  };

  const columnsConfig = stockColumns();

  return (
    <div className="space-y-6">
      <PageHeader
        title="재고 출고"
        description="판매, 생산투입, 조정 등의 사유로 재고를 출고합니다."
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Minus className="mr-2 h-4 w-4" />
            출고 등록
          </Button>
        }
      />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">출고 가능 재고</h3>
        <DataTable
          columns={columnsConfig}
          data={stocksResponse?.data ?? []}
          isLoading={isLoading}
        />
      </div>

      <FormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        title="재고 출고"
        description="재고를 출고합니다. 수량을 입력하지 않으면 전체 수량이 출고됩니다."
      >
        <StockOutForm onSuccess={handleFormSuccess} />
      </FormSheet>
    </div>
  );
}
