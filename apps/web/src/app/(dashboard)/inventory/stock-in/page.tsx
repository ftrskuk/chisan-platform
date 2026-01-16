"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { FormSheet } from "@/components/form-sheet";
import { StockInForm } from "@/components/stocks/stock-in-form";
import { DataTable } from "@/components/data-table";
import { useStocks } from "@/hooks/api";
import { stockColumns } from "@/components/stocks/stock-columns";

export default function StockInPage() {
  const [formOpen, setFormOpen] = useState(false);

  const { data: stocksResponse, isLoading } = useStocks({
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
        title="재고 입고"
        description="외부 수입 또는 생산된 제품을 창고에 입고합니다."
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            입고 등록
          </Button>
        }
      />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">최근 입고 현황</h3>
        <DataTable
          columns={columnsConfig}
          data={stocksResponse?.data ?? []}
          isLoading={isLoading}
        />
      </div>

      <FormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        title="재고 입고"
        description="새로운 재고를 입고합니다. 배치 번호는 자동 생성됩니다."
      >
        <StockInForm onSuccess={handleFormSuccess} />
      </FormSheet>
    </div>
  );
}
