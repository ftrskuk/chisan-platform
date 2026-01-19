"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { completeJobV2Schema } from "@repo/shared";
import type {
  CompleteJobV2Input,
  SlittingJobRollWithRelations,
} from "@repo/shared";

import { useCompleteJobV2 } from "@/hooks/api";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingButton } from "@/components/loading-button";

interface JobCompleteFormProps {
  jobId: string;
  completedRolls: SlittingJobRollWithRelations[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function JobCompleteForm({
  jobId,
  completedRolls,
  onSuccess,
  onCancel,
}: JobCompleteFormProps) {
  const completeJob = useCompleteJobV2();

  const totalOutputs = completedRolls.reduce(
    (sum, roll) => sum + (roll.actualOutputs?.length ?? 0),
    0,
  );

  const form = useForm<CompleteJobV2Input>({
    resolver: zodResolver(completeJobV2Schema),
    defaultValues: {
      memo: "",
    },
  });

  const onSubmit = async (data: CompleteJobV2Input) => {
    try {
      await completeJob.mutateAsync({ jobId, data });
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">완료된 롤</p>
                <p className="text-xl font-bold">{completedRolls.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">총 산출물</p>
                <p className="text-xl font-bold">{totalOutputs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="memo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>완료 메모 (선택)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="작업 완료 시 특이사항을 입력하세요..."
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
            loading={completeJob.isPending}
          >
            작업 완료
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}
