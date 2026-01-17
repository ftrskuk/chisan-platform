"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStockOutSchema, STOCK_OUT_REASON_TYPES } from "@repo/shared";
import type { CreateStockOutInput, StockWithRelations } from "@repo/shared";
import { useCreateStockOut, useStocks } from "@/hooks/api";
import { toast } from "sonner";
import { Loader2, Package, MapPin, Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

interface StockOutFormProps {
  onSuccess: () => void;
  preselectedStockId?: string;
}

const reasonTypeLabels: Record<string, string> = {
  sale: "판매",
  production: "생산투입",
  adjustment: "재고조정",
  disposal: "폐기",
  transfer: "이동",
};

export function StockOutForm({
  onSuccess,
  preselectedStockId,
}: StockOutFormProps) {
  const [selectedStock, setSelectedStock] = useState<StockWithRelations | null>(
    null,
  );

  const { data: stocksResponse } = useStocks({
    status: "available",
    isActive: true,
    limit: 100,
    offset: 0,
  });
  const createMutation = useCreateStockOut();

  const availableStocks = useMemo(
    () => stocksResponse?.data ?? [],
    [stocksResponse?.data],
  );

  const form = useForm<CreateStockOutInput>({
    resolver: zodResolver(createStockOutSchema),
    defaultValues: {
      stockId: preselectedStockId ?? "",
      reasonType: "sale",
    },
  });

  useEffect(() => {
    if (preselectedStockId) {
      const stock = availableStocks.find((s) => s.id === preselectedStockId);
      if (stock) {
        setSelectedStock(stock);
        form.setValue("stockId", preselectedStockId);
      }
    }
  }, [preselectedStockId, availableStocks, form]);

  const handleStockChange = (stockId: string) => {
    const stock = availableStocks.find((s) => s.id === stockId);
    setSelectedStock(stock ?? null);
    form.setValue("stockId", stockId);
    form.setValue("quantity", undefined);
    form.setValue("weightKg", undefined);
  };

  const onSubmit = async (data: CreateStockOutInput) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success("출고 처리가 완료되었습니다.");
      form.reset();
      setSelectedStock(null);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "출고 처리 중 오류가 발생했습니다.",
      );
    }
  };

  const isLoading = createMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="stockId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>출고할 재고 선택 *</FormLabel>
              <Select onValueChange={handleStockChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="출고할 재고를 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableStocks.map((stock) => (
                    <SelectItem key={stock.id} value={stock.id}>
                      {stock.item.displayName} -{" "}
                      {stock.batchNumber ?? stock.id.slice(0, 8)} (
                      {stock.quantity}개,{" "}
                      {stock.weightKg?.toLocaleString() ?? "-"}kg)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedStock && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">품목</p>
                    <p className="font-medium">
                      {selectedStock.item.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedStock.item.itemCode}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">위치</p>
                    <p className="font-medium">
                      {selectedStock.warehouse.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedStock.location.code}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">현재 수량 / 중량</p>
                    <p className="font-medium">
                      {selectedStock.quantity}개 /{" "}
                      {selectedStock.weightKg?.toLocaleString() ?? "-"} kg
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">폭</p>
                  <p className="font-medium">{selectedStock.widthMm} mm</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>출고 수량</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={
                      selectedStock ? `최대 ${selectedStock.quantity}` : ""
                    }
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormDescription>미입력 시 전체 수량 출고</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weightKg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>출고 중량 (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder={
                      selectedStock?.weightKg
                        ? `최대 ${selectedStock.weightKg}`
                        : ""
                    }
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormDescription>미입력 시 전체 중량 출고</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reasonType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>출고 사유 *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="사유 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {STOCK_OUT_REASON_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {reasonTypeLabels[type] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>상세 사유</FormLabel>
              <FormControl>
                <Input {...field} placeholder="상세 사유 입력 (선택)" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비고</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="특이사항을 입력하세요"
                  className="resize-none"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={isLoading || !selectedStock}
            className="w-full sm:w-auto"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            출고 처리
          </Button>
        </div>
      </form>
    </Form>
  );
}
