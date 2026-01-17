"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createStockInSchema,
  STOCK_CONDITIONS,
  STOCK_SOURCE_TYPES,
} from "@repo/shared";
import type { CreateStockInInput } from "@repo/shared";
import {
  useCreateStockIn,
  useItems,
  useWarehouses,
  useLocations,
} from "@/hooks/api";
import { toast } from "sonner";
import { Loader2, ScanBarcode } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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

interface StockInFormProps {
  onSuccess: () => void;
}

const conditionLabels: Record<string, string> = {
  parent: "원지",
  slitted: "슬리팅",
};

const sourceTypeLabels: Record<string, string> = {
  import: "수입",
  production: "생산",
  adjustment: "조정",
};

export function StockInForm({ onSuccess }: StockInFormProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");

  const { data: items } = useItems({ isActive: true });
  const { data: warehouses } = useWarehouses();
  const { data: locations } = useLocations(selectedWarehouseId);
  const createMutation = useCreateStockIn();

  const form = useForm<CreateStockInInput>({
    resolver: zodResolver(createStockInSchema),
    defaultValues: {
      quantity: 1,
      widthMm: 1000,
      weightKg: 1,
      condition: "parent",
      sourceType: "import",
    },
  });

  const onSubmit = async (data: CreateStockInInput) => {
    try {
      const result = await createMutation.mutateAsync(data);
      toast.success(
        `입고 처리가 완료되었습니다. (Batch: ${result.batchNumber})`,
      );
      form.reset();
      setSelectedWarehouseId("");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "입고 처리 중 오류가 발생했습니다.",
      );
    }
  };

  const isLoading = createMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center hover:bg-muted/50 transition-colors">
          <div className="flex flex-col items-center gap-2">
            <ScanBarcode className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium">
              바코드를 스캔하여 빠른 입력 (준비 중)
            </p>
            <Input
              placeholder="바코드 번호 직접 입력"
              className="max-w-xs mt-2 bg-background"
              disabled
            />
          </div>
        </div>

        <Separator />

        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="itemId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>품목 선택 *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="입고할 품목을 선택하세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {items?.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.displayName} ({item.itemCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormItem>
              <FormLabel>창고 선택</FormLabel>
              <Select
                value={selectedWarehouseId}
                onValueChange={(value) => {
                  setSelectedWarehouseId(value);
                  form.setValue("locationId", "");
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="창고 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {warehouses?.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>

            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>위치 선택 *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedWarehouseId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="위치 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations?.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.code} {loc.name && `(${loc.name})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="widthMm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>폭 (mm) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weightKg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>중량 (kg) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.001"
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상태 *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="상태 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STOCK_CONDITIONS.map((condition) => (
                        <SelectItem key={condition} value={condition}>
                          {conditionLabels[condition] || condition}
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
              name="sourceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>입고 유형 *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="유형 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STOCK_SOURCE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {sourceTypeLabels[type] || type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="lotNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lot 번호</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="제조사 Lot 번호 입력" />
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
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            입고 처리
          </Button>
        </div>
      </form>
    </Form>
  );
}
