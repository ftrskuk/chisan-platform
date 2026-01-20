"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { createShipmentSchema } from "@repo/shared";
import type {
  CreateShipmentInput,
  ImportOrderWithRelations,
} from "@repo/shared";

type FormValues = CreateShipmentInput;
import { useCreateShipment } from "@/hooks/api/use-import";
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

interface ShipmentFormProps {
  importOrder: ImportOrderWithRelations;
  onSuccess: () => void;
}

export function ShipmentForm({ importOrder, onSuccess }: ShipmentFormProps) {
  const createShipment = useCreateShipment();

  const availableItems = importOrder.items.filter(
    (item) => item.quantity > item.shippedQuantity,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(createShipmentSchema),
    defaultValues: {
      importOrderId: importOrder.id,
      containerCount: 1,
      items:
        availableItems.length > 0 && availableItems[0]
          ? [{ importOrderItemId: availableItems[0].id, shippedQuantity: 1 }]
          : [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createShipment.mutateAsync(data as CreateShipmentInput);
      toast.success("선적이 등록되었습니다.");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "선적 등록에 실패했습니다.",
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            PO번호:{" "}
            <span className="font-mono font-medium">
              {importOrder.poNumber}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            공급업체:{" "}
            <span className="font-medium">{importOrder.partner.name}</span>
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="blNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>B/L 번호</FormLabel>
                <FormControl>
                  <Input
                    placeholder="선하증권 번호"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="containerCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>컨테이너 수 *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
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
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="vesselName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>선박명</FormLabel>
                <FormControl>
                  <Input
                    placeholder="선박명"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="voyageNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>항차번호</FormLabel>
                <FormControl>
                  <Input
                    placeholder="항차번호"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="portOfLoading"
            render={({ field }) => (
              <FormItem>
                <FormLabel>선적항</FormLabel>
                <FormControl>
                  <Input
                    placeholder="예: BUSAN, SHANGHAI"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="portOfDischarge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>도착항</FormLabel>
                <FormControl>
                  <Input
                    placeholder="예: INCHEON, BUSAN"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="etd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ETD (예상 출항일)</FormLabel>
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
            name="eta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ETA (예상 도착일)</FormLabel>
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
        </div>

        <FormField
          control={form.control}
          name="memo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>메모</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="선적 메모..."
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
            <FormLabel className="text-base">선적 품목 *</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={availableItems.length === 0}
              onClick={() => {
                const firstItem = availableItems[0];
                if (firstItem) {
                  append({
                    importOrderItemId: firstItem.id,
                    shippedQuantity: 1,
                  });
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              품목 추가
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name={`items.${index}.importOrderItemId`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>품목 *</FormLabel>
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
                          {availableItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.item.itemCode} - {item.widthMm}mm (잔량:{" "}
                              {item.quantity - item.shippedQuantity})
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
                  name={`items.${index}.shippedQuantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>선적수량 *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
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
              </div>

              <div className="mt-4 flex items-center justify-between">
                <FormField
                  control={form.control}
                  name={`items.${index}.notes`}
                  render={({ field }) => (
                    <FormItem className="flex-1 mr-4">
                      <FormControl>
                        <Input
                          placeholder="품목 비고..."
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
            </Card>
          ))}

          {availableItems.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              선적 가능한 품목이 없습니다.
            </p>
          )}
        </div>

        <LoadingButton
          type="submit"
          className="w-full"
          loading={createShipment.isPending}
          disabled={fields.length === 0}
        >
          선적 등록
        </LoadingButton>
      </form>
    </Form>
  );
}
