"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { createImportOrderSchema, CURRENCIES } from "@repo/shared";
import type { Currency } from "@repo/shared";
import { useCreateImportOrder } from "@/hooks/api/use-import";
import { useItems, usePartners } from "@/hooks/api";
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
import { currencyLabels } from "@/lib/constants/import-labels";

type FormValues = z.input<typeof createImportOrderSchema>;

interface ImportOrderFormProps {
  onSuccess: () => void;
}

export function ImportOrderForm({ onSuccess }: ImportOrderFormProps) {
  const createOrder = useCreateImportOrder();
  const { data: items } = useItems();
  const { data: partners } = usePartners();

  const suppliers = partners?.filter(
    (p) => p.partnerType === "supplier" || p.partnerType === "both",
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(createImportOrderSchema),
    defaultValues: {
      partnerId: "",
      currency: "USD" as Currency,
      items: [{ itemId: "", widthMm: 500, quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createOrder.mutateAsync(
        data as z.infer<typeof createImportOrderSchema>,
      );
      toast.success("수입 주문이 등록되었습니다.");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "주문 등록에 실패했습니다.",
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="partnerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>공급업체 *</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="공급업체 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {suppliers?.map((partner) => (
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

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="orderDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>주문일</FormLabel>
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
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>통화 *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="통화 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currencyLabels[currency]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="expectedEtd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>예상 출항일 (ETD)</FormLabel>
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
            name="expectedEta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>예상 도착일 (ETA)</FormLabel>
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

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="exchangeRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>환율</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="예: 1350.00"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined,
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
            name="paymentTerms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>결제조건</FormLabel>
                <FormControl>
                  <Input
                    placeholder="예: T/T 30 days"
                    {...field}
                    value={field.value ?? ""}
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
            <FormLabel className="text-base">주문 품목 *</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ itemId: "", widthMm: 500, quantity: 1, unitPrice: 0 })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              품목 추가
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name={`items.${index}.itemId`}
                  render={({ field }) => (
                    <FormItem>
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

                <FormField
                  control={form.control}
                  name={`items.${index}.widthMm`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>폭 (mm) *</FormLabel>
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
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>수량 *</FormLabel>
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
                  name={`items.${index}.weightKg`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>중량 (kg)</FormLabel>
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

                <FormField
                  control={form.control}
                  name={`items.${index}.unitPrice`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>단가 *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
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

              <FormField
                control={form.control}
                name={`items.${index}.notes`}
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>비고</FormLabel>
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
