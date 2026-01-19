"use client";

import { useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { SlittingPlannedOutputWithRelations } from "@repo/shared";
import { z } from "zod";

import { useRecordOutput, useItems } from "@/hooks/api";

const outputFormSchema = z.object({
  plannedOutputId: z.string().optional(),
  itemId: z.string().min(1),
  widthMm: z.coerce.number().int().min(50).max(2500),
  quantity: z.coerce.number().int().positive(),
  lengthM: z.coerce.number().positive().optional(),
  weightKg: z.coerce.number().positive().optional(),
  isLoss: z.boolean(),
  notes: z.string().max(500).optional(),
});

type OutputFormValues = z.infer<typeof outputFormSchema>;
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingButton } from "@/components/loading-button";

interface OutputRecordFormProps {
  jobId: string;
  rollId: string;
  plannedOutputs?: SlittingPlannedOutputWithRelations[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function OutputRecordForm({
  jobId,
  rollId,
  plannedOutputs = [],
  onSuccess,
  onCancel,
}: OutputRecordFormProps) {
  const recordOutput = useRecordOutput();
  const { data: items } = useItems({ isActive: true });
  const activeItems = useMemo(() => items ?? [], [items]);

  const form = useForm<OutputFormValues>({
    resolver: zodResolver(outputFormSchema),
    defaultValues: {
      plannedOutputId: undefined,
      itemId: "",
      widthMm: 500,
      quantity: 1,
      lengthM: undefined,
      weightKg: undefined,
      isLoss: false,
      notes: "",
    },
  });

  const selectedPlannedId = form.watch("plannedOutputId");

  useEffect(() => {
    if (selectedPlannedId && selectedPlannedId !== "__none__") {
      const planned = plannedOutputs.find((p) => p.id === selectedPlannedId);
      if (planned) {
        form.setValue("itemId", planned.itemId);
        form.setValue("widthMm", planned.widthMm);
      }
    }
  }, [selectedPlannedId, plannedOutputs, form]);

  const onSubmit = async (data: OutputFormValues) => {
    const submitData = {
      ...data,
      plannedOutputId:
        data.plannedOutputId === "__none__" ? undefined : data.plannedOutputId,
    };

    try {
      await recordOutput.mutateAsync({ jobId, rollId, data: submitData });
      toast.success("산출물이 기록되었습니다.");
      form.reset();
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "산출물 기록에 실패했습니다.",
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {plannedOutputs.length > 0 && (
          <FormField
            control={form.control}
            name="plannedOutputId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>계획 산출물 (선택)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? "__none__"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="계획 선택 (자동 입력)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">직접 입력</SelectItem>
                    {plannedOutputs.map((planned) => (
                      <SelectItem key={planned.id} value={planned.id}>
                        {planned.item.displayName} - {planned.widthMm}mm ×{" "}
                        {planned.quantity}개
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
          name="itemId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>품목 *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="품목 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {activeItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.paperType?.nameKo ??
                        item.paperType?.nameEn ??
                        item.displayName}{" "}
                      {item.grammage}g
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="widthMm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>폭 (mm) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={50}
                    max={2500}
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? "" : Number(e.target.value),
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
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>수량 *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="lengthM"
            render={({ field }) => (
              <FormItem>
                <FormLabel>길이 (m)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    placeholder="선택"
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
                <FormLabel>중량 (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    placeholder="선택"
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

        <FormField
          control={form.control}
          name="isLoss"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0 rounded-lg border p-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal text-amber-600">
                손실로 기록 (불량/로스)
              </FormLabel>
            </FormItem>
          )}
        />

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
            loading={recordOutput.isPending}
          >
            기록
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}
