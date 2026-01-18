"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createScheduleSchema } from "@repo/shared";
import type { CreateScheduleInput } from "@repo/shared";
import { useCreateSlittingSchedule } from "@/hooks/api";
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
import { LoadingButton } from "@/components/loading-button";

interface ScheduleFormProps {
  onSuccess: () => void;
}

export function ScheduleForm({ onSuccess }: ScheduleFormProps) {
  const createSchedule = useCreateSlittingSchedule();

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<CreateScheduleInput>({
    resolver: zodResolver(createScheduleSchema),
    defaultValues: {
      scheduledDate: today,
      memo: "",
    },
  });

  const onSubmit = async (data: CreateScheduleInput) => {
    try {
      await createSchedule.mutateAsync(data);
      toast.success("슬리팅 일정이 등록되었습니다.");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "일정 등록에 실패했습니다.",
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="scheduledDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>예정일</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
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

        <LoadingButton
          type="submit"
          className="w-full"
          loading={createSchedule.isPending}
        >
          일정 등록
        </LoadingButton>
      </form>
    </Form>
  );
}
