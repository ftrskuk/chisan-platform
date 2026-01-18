"use client";

import { useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, Package, Scale, Ruler } from "lucide-react";
import { z } from "zod";
import type { SlittingJobWithRelations } from "@repo/shared";

import { useCompleteSlittingJob, useItems } from "@/hooks/api";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LoadingButton } from "@/components/loading-button";

const outputSchema = z.object({
  itemId: z.string().uuid(),
  widthMm: z.coerce.number().int().min(50).max(2500),
  quantity: z.coerce.number().int().positive(),
  weightKg: z.coerce.number().positive().optional(),
  isLoss: z.boolean(),
  notes: z.string().max(500).optional(),
});

const formSchema = z.object({
  outputs: z.array(outputSchema).min(1).max(50),
  memo: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CompleteJobFormProps {
  job: SlittingJobWithRelations;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CompleteJobForm({
  job,
  onSuccess,
  onCancel,
}: CompleteJobFormProps) {
  const completeJob = useCompleteSlittingJob();
  const { data: items } = useItems({ isActive: true });

  const activeItems = useMemo(() => items ?? [], [items]);
  const parentItem = job.parentStock.item;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      outputs: [
        {
          itemId: parentItem.id,
          widthMm: 500,
          quantity: 1,
          weightKg: undefined,
          isLoss: false,
          notes: "",
        },
      ],
      memo: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "outputs",
  });

  const outputs = form.watch("outputs");

  const totals = useMemo(() => {
    const totalQty = outputs.reduce((sum, o) => sum + (o.quantity || 0), 0);
    const totalWeight = outputs.reduce((sum, o) => sum + (o.weightKg || 0), 0);
    const lossCount = outputs.filter((o) => o.isLoss).length;
    const lossQty = outputs
      .filter((o) => o.isLoss)
      .reduce((sum, o) => sum + (o.quantity || 0), 0);
    return { totalQty, totalWeight, lossCount, lossQty };
  }, [outputs]);

  const addOutput = () => {
    append({
      itemId: parentItem.id,
      widthMm: 500,
      quantity: 1,
      weightKg: undefined,
      isLoss: false,
      notes: "",
    });
  };

  const onSubmit = async (data: FormValues) => {
    try {
      await completeJob.mutateAsync({ id: job.id, data });
      toast.success("작업이 완료되었습니다.");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "작업 완료에 실패했습니다.",
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">원지 정보</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">품목</p>
                <p className="font-medium">
                  {parentItem.paperType.nameKo ?? parentItem.paperType.nameEn}{" "}
                  {parentItem.grammage}g
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">폭</p>
                <p className="font-medium">{job.parentStock.widthMm} mm</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">수량 / 중량</p>
                <p className="font-medium">
                  {job.parentStock.quantity}개 /{" "}
                  {job.parentStock.weightKg?.toLocaleString() ?? "-"} kg
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">산출물 목록</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOutput}
              disabled={fields.length >= 50}
            >
              <Plus className="mr-2 h-4 w-4" />
              추가
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <Card key={field.id} className="relative">
                <CardContent className="pt-4 pb-3">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-4">
                        <FormField
                          control={form.control}
                          name={`outputs.${index}.itemId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">품목</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="품목 선택" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {activeItems.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.paperType.nameKo ??
                                        item.paperType.nameEn}{" "}
                                      {item.grammage}g
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`outputs.${index}.widthMm`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">폭 (mm)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={50}
                                  max={2500}
                                  className="h-9"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === ""
                                        ? ""
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

                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`outputs.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">수량</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  className="h-9"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === ""
                                        ? ""
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

                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`outputs.${index}.weightKg`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                중량 (kg)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.1"
                                  placeholder="선택"
                                  className="h-9"
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

                      <div className="col-span-2 flex items-center gap-2 pb-1">
                        <FormField
                          control={form.control}
                          name={`outputs.${index}.isLoss`}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-xs font-normal text-amber-600">
                                손실
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name={`outputs.${index}.notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="비고 (선택사항)"
                              className="h-8 text-sm"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="bg-blue-50/50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">요약</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Ruler className="h-3 w-3" />
                  <span className="text-xs">원지</span>
                </div>
                <p className="font-medium">
                  폭 {job.parentStock.widthMm}mm / {job.parentStock.quantity}개,{" "}
                  {job.parentStock.weightKg?.toLocaleString() ?? "-"}kg
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="h-3 w-3" />
                  <span className="text-xs">산출 합계</span>
                </div>
                <p className="font-medium">
                  {totals.totalQty}개, {totals.totalWeight.toLocaleString()}kg
                  {totals.lossCount > 0 && (
                    <span className="text-amber-600 ml-2">
                      (손실 {totals.lossQty}개)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <FormField
          control={form.control}
          name="memo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>완료 메모 (선택)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="작업 완료 시 특이사항을 기록하세요..."
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

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
          <LoadingButton type="submit" loading={completeJob.isPending}>
            작업 완료
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}
