"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { completeRollSchema } from "@repo/shared";
import type { CompleteRollInput } from "@repo/shared";

import { useCompleteRoll } from "@/hooks/api";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/components/loading-button";

interface RollCompleteFormProps {
  jobId: string;
  rollId: string;
  outputCount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RollCompleteForm({
  jobId,
  rollId,
  outputCount,
  onSuccess,
  onCancel,
}: RollCompleteFormProps) {
  const completeRoll = useCompleteRoll();

  const form = useForm<CompleteRollInput>({
    resolver: zodResolver(completeRollSchema),
    defaultValues: {
      notes: "",
    },
  });

  const onSubmit = async (data: CompleteRollInput) => {
    try {
      await completeRoll.mutateAsync({ jobId, rollId, data });
      toast.success("롤 작업이 완료되었습니다.");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "롤 완료에 실패했습니다.",
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <p className="text-sm text-muted-foreground">기록된 산출물</p>
          <p className="text-2xl font-bold">{outputCount}건</p>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>완료 메모 (선택)</FormLabel>
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
            loading={completeRoll.isPending}
          >
            롤 완료
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}
