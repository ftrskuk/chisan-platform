"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  createOrderSchema,
  ORDER_IN_REASONS,
  ORDER_OUT_REASONS,
} from "@repo/shared";
import type { CreateOrderInput, OrderType } from "@repo/shared";
import { useCreateOrder, useItems, usePartners, useStocks } from "@/hooks/api";
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
import { LoadingButton } from "@/components/loading-button";
import { Card } from "@/components/ui/card";
import { reasonLabels } from "@/lib/constants/order-labels";

interface OrderFormProps {
  onSuccess: () => void;
}

export function OrderForm({ onSuccess }: OrderFormProps) {
  const createOrder = useCreateOrder();
  const { data: items } = useItems();
  const { data: partners } = usePartners();
  const { data: stocksResponse } = useStocks({
    status: "available",
    limit: 100,
    offset: 0,
  });

  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      type: "stock_out",
      reason: "sales",
      items: [{ itemId: "", widthMm: 500, requestedQty: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchType = form.watch("type");

  const handleTypeChange = (type: OrderType) => {
    form.setValue("type", type);
    form.setValue("reason", type === "stock_in" ? "container" : "sales");
  };

  const onSubmit = async (data: CreateOrderInput) => {
    try {
      await createOrder.mutateAsync(data);
      toast.success("주문이 등록되었습니다.");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "주문 등록에 실패했습니다.",
      );
    }
  };

  const reasonOptions =
    watchType === "stock_in" ? ORDER_IN_REASONS : ORDER_OUT_REASONS;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>주문 유형</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value: OrderType) => {
                  field.onChange(value);
                  handleTypeChange(value);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="유형 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="stock_in">입고 (Stock In)</SelectItem>
                  <SelectItem value="stock_out">출고 (Stock Out)</SelectItem>
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
              <FormLabel>사유</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="사유 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {reasonOptions.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reasonLabels[reason] ?? reason}
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
          name="partnerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>거래처 (선택)</FormLabel>
              <Select
                value={field.value ?? "none"}
                onValueChange={(value) =>
                  field.onChange(value === "none" ? undefined : value)
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="거래처 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">선택 안함</SelectItem>
                  {partners?.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name}
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
          name="scheduledDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>예정일 (선택)</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormControl>
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
                  placeholder="메모를 입력하세요..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel className="text-base">주문 품목</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ itemId: "", widthMm: 500, requestedQty: 1 })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              품목 추가
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`items.${index}.itemId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>품목</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="품목 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {items?.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.itemCode} - {item.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchType === "stock_out" && (
                  <FormField
                    control={form.control}
                    name={`items.${index}.stockId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>재고 지정 (선택)</FormLabel>
                        <Select
                          value={field.value ?? "none"}
                          onValueChange={(value) =>
                            field.onChange(value === "none" ? undefined : value)
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="재고 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">자동 선택</SelectItem>
                            {stocksResponse?.data.map((stock) => (
                              <SelectItem key={stock.id} value={stock.id}>
                                {stock.item.itemCode} - {stock.widthMm}mm (수량:{" "}
                                {stock.quantity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name={`items.${index}.widthMm`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>폭 (mm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.requestedQty`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>요청 수량</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.requestedWeightKg`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>요청 중량 (kg, 선택)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-end">
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <LoadingButton
          type="submit"
          className="w-full"
          loading={createOrder.isPending}
        >
          주문 등록
        </LoadingButton>
      </form>
    </Form>
  );
}
