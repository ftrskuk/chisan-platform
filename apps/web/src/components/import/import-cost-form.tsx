"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import {
  createImportCostSchema,
  IMPORT_COST_TYPES,
  CURRENCIES,
} from "@repo/shared";
import type { CreateImportCostInput } from "@repo/shared";

type FormValues = z.input<typeof createImportCostSchema>;
import { useCreateImportCost } from "@/hooks/api/use-import";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  importCostTypeLabels,
  currencyLabels,
} from "@/lib/constants/import-labels";

interface ImportCostFormProps {
  importOrderId?: string;
  shipmentId?: string;
  onSuccess: () => void;
}

export function ImportCostForm({
  importOrderId,
  shipmentId,
  onSuccess,
}: ImportCostFormProps) {
  const createCost = useCreateImportCost();

  const form = useForm<FormValues>({
    resolver: zodResolver(createImportCostSchema),
    defaultValues: {
      importOrderId,
      shipmentId,
      costType: "freight",
      amount: 0,
      currency: "KRW",
      isPaid: false,
    },
  });

  const watchCurrency = form.watch("currency");

  const onSubmit = async (data: FormValues) => {
    try {
      await createCost.mutateAsync(data as CreateImportCostInput);
      toast.success("비용이 등록되었습니다.");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "비용 등록에 실패했습니다.",
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="costType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비용 유형 *</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="비용 유형 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {IMPORT_COST_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {importCostTypeLabels[type]}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>설명</FormLabel>
              <FormControl>
                <Input
                  placeholder="비용 설명..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>금액 *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
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

        {watchCurrency !== "KRW" && (
          <FormField
            control={form.control}
            name="amountKrw"
            render={({ field }) => (
              <FormItem>
                <FormLabel>원화 금액</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="원화 환산 금액"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="vendorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>업체명</FormLabel>
                <FormControl>
                  <Input
                    placeholder="결제 대상 업체명"
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
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>청구서 번호</FormLabel>
                <FormControl>
                  <Input
                    placeholder="청구서/인보이스 번호"
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
          name="isPaid"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>결제 완료</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {form.watch("isPaid") && (
          <FormField
            control={form.control}
            name="paidAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>결제일</FormLabel>
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
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비고</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="추가 메모..."
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
          loading={createCost.isPending}
        >
          비용 등록
        </LoadingButton>
      </form>
    </Form>
  );
}
