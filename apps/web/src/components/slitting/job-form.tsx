"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createJobSchema } from "@repo/shared";
import type { CreateJobInput, StockWithRelations } from "@repo/shared";
import {
  useCreateSlittingJob,
  useMachines,
  useStocks,
  useUsers,
} from "@/hooks/api";
import { Package, MapPin, Scale, Ruler } from "lucide-react";

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
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoadingButton } from "@/components/loading-button";

interface JobFormProps {
  scheduleId: string;
  onSuccess: () => void;
}

export function JobForm({ scheduleId, onSuccess }: JobFormProps) {
  const [selectedStock, setSelectedStock] = useState<StockWithRelations | null>(
    null,
  );

  const createJob = useCreateSlittingJob();

  const { data: machinesResponse } = useMachines();
  const { data: stocksResponse } = useStocks({
    condition: "parent",
    status: "available",
    isActive: true,
    limit: 100,
    offset: 0,
  });
  const { data: users } = useUsers();

  const machines = useMemo(
    () => machinesResponse?.data ?? [],
    [machinesResponse?.data],
  );
  const availableStocks = useMemo(
    () => stocksResponse?.data ?? [],
    [stocksResponse?.data],
  );
  const activeUsers = useMemo(
    () => users?.filter((u) => u.isActive) ?? [],
    [users],
  );

  const form = useForm<CreateJobInput>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      scheduleId,
      machineId: "",
      parentStockId: "",
      operatorId: undefined,
      sequenceNumber: undefined,
      memo: "",
    },
  });

  const handleStockChange = (stockId: string) => {
    const stock = availableStocks.find((s) => s.id === stockId);
    setSelectedStock(stock ?? null);
    form.setValue("parentStockId", stockId);
  };

  const onSubmit = async (data: CreateJobInput) => {
    try {
      await createJob.mutateAsync(data);
      toast.success("슬리팅 작업이 추가되었습니다.");
      form.reset({ scheduleId, machineId: "", parentStockId: "", memo: "" });
      setSelectedStock(null);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "작업 추가에 실패했습니다.",
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="machineId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>기계 선택 *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="기계를 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {machines.map((machine) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.name}
                      {machine.status !== "idle" && (
                        <span className="ml-2 text-muted-foreground">
                          ({machine.status === "running" ? "가동중" : "정비중"})
                        </span>
                      )}
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
          name="parentStockId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>원지 선택 *</FormLabel>
              <Select onValueChange={handleStockChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="원지 재고를 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableStocks.map((stock) => (
                    <SelectItem key={stock.id} value={stock.id}>
                      {stock.item.displayName} - {stock.widthMm}mm (
                      {stock.quantity}개,{" "}
                      {stock.weightKg?.toLocaleString() ?? "-"}kg)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                condition: parent, status: available 인 재고만 표시됩니다.
              </FormDescription>
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
                      {selectedStock.item.paperType.nameKo ??
                        selectedStock.item.paperType.nameEn}{" "}
                      {selectedStock.item.grammage}g
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedStock.item.brand?.name ?? "브랜드 없음"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">폭</p>
                    <p className="font-medium">{selectedStock.widthMm} mm</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">수량 / 중량</p>
                    <p className="font-medium">
                      {selectedStock.quantity}개 /{" "}
                      {selectedStock.weightKg?.toLocaleString() ?? "-"} kg
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
                {selectedStock.batchNumber && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">배치번호</p>
                    <p className="font-mono text-sm">
                      {selectedStock.batchNumber}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        <FormField
          control={form.control}
          name="operatorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>작업자 (선택)</FormLabel>
              <Select
                onValueChange={(val) => field.onChange(val || undefined)}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="작업자를 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">선택 안함</SelectItem>
                  {activeUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.displayName ?? user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                작업 시작 시 지정할 수도 있습니다.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sequenceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>작업 순서 (선택)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="자동 부여됩니다"
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
              <FormDescription>
                비워두면 자동으로 순서가 부여됩니다.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="memo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>메모 (선택)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="작업 관련 메모를 입력하세요..."
                  className="resize-none"
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <LoadingButton
          type="submit"
          className="w-full"
          loading={createJob.isPending}
          disabled={!selectedStock}
        >
          작업 추가
        </LoadingButton>
      </form>
    </Form>
  );
}
