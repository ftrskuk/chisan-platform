"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Package, Scale, Ruler } from "lucide-react";
import { registerRollSchema } from "@repo/shared";
import type { RegisterRollInput, SlittingJobWithRelations } from "@repo/shared";

import { useRegisterRoll, useStocks } from "@/hooks/api";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingButton } from "@/components/loading-button";

interface RollRegisterFormProps {
  job: SlittingJobWithRelations;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RollRegisterForm({
  job,
  onSuccess,
  onCancel,
}: RollRegisterFormProps) {
  const registerRoll = useRegisterRoll();

  const { data: stocksResponse } = useStocks({
    condition: "parent",
    status: "available",
    isActive: true,
    itemId: job.itemId ?? undefined,
    widthMm: job.parentWidthMm ?? undefined,
    limit: 100,
    offset: 0,
  });

  const availableStocks = useMemo(
    () => stocksResponse?.data ?? [],
    [stocksResponse?.data],
  );

  const form = useForm<RegisterRollInput>({
    resolver: zodResolver(registerRollSchema),
    defaultValues: {
      stockId: "",
      notes: "",
    },
  });

  const selectedStockId = form.watch("stockId");
  const selectedStock = useMemo(
    () => availableStocks.find((s) => s.id === selectedStockId),
    [availableStocks, selectedStockId],
  );

  const onSubmit = async (data: RegisterRollInput) => {
    try {
      await registerRoll.mutateAsync({ jobId: job.id, data });
      toast.success("롤이 등록되었습니다.");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "롤 등록에 실패했습니다.",
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="stockId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>원지 선택 *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="원지 재고를 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableStocks.map((stock) => (
                    <SelectItem key={stock.id} value={stock.id}>
                      {stock.batchNumber ?? stock.id.slice(0, 8)} -{" "}
                      {stock.widthMm}mm (
                      {stock.weightKg?.toLocaleString() ?? "-"}kg)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {job.item?.displayName ?? "품목"}, {job.parentWidthMm ?? "-"}mm
                규격의 재고만 표시됩니다.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedStock && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">품목</p>
                    <p className="font-medium">
                      {selectedStock.item.paperType.nameKo ??
                        selectedStock.item.paperType.nameEn}{" "}
                      {selectedStock.item.grammage}g
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">폭</p>
                    <p className="font-medium">{selectedStock.widthMm} mm</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">중량</p>
                    <p className="font-medium">
                      {selectedStock.weightKg?.toLocaleString() ?? "-"} kg
                    </p>
                  </div>
                </div>
                {selectedStock.batchNumber && (
                  <div>
                    <p className="text-xs text-muted-foreground">배치번호</p>
                    <p className="font-mono text-sm">
                      {selectedStock.batchNumber}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>메모 (선택)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="특이사항을 입력하세요..."
                  className="resize-none"
                  rows={2}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-2">
          <LoadingButton
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            취소
          </LoadingButton>
          <LoadingButton
            type="submit"
            className="flex-1"
            loading={registerRoll.isPending}
            disabled={!selectedStockId}
          >
            롤 등록
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}
