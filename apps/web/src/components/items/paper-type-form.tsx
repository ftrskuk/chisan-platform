"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPaperTypeSchema,
  type CreatePaperTypeInput,
  type PaperType,
} from "@repo/shared";
import { useCreatePaperType, useUpdatePaperType } from "@/hooks/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

interface PaperTypeFormProps {
  paperType?: PaperType | null;
  onSuccess: () => void;
}

export function PaperTypeForm({ paperType, onSuccess }: PaperTypeFormProps) {
  const isEditing = !!paperType;

  const form = useForm<CreatePaperTypeInput>({
    resolver: zodResolver(createPaperTypeSchema),
    defaultValues: paperType
      ? {
          code: paperType.code,
          nameEn: paperType.nameEn,
          nameKo: paperType.nameKo ?? undefined,
          description: paperType.description ?? undefined,
          sortOrder: paperType.sortOrder,
        }
      : {
          code: "",
          nameEn: "",
          sortOrder: 0,
        },
  });

  const createMutation = useCreatePaperType();
  const updateMutation = useUpdatePaperType();

  const onSubmit = async (data: CreatePaperTypeInput) => {
    try {
      if (isEditing && paperType) {
        await updateMutation.mutateAsync({ id: paperType.id, data });
        toast.success("지종이 수정되었습니다.");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("지종이 생성되었습니다.");
      }
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "오류가 발생했습니다.",
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>코드 *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="WF"
                  disabled={isEditing}
                  className="uppercase"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nameEn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>영문명 *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Woodfree" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nameKo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>한글명</FormLabel>
              <FormControl>
                <Input {...field} placeholder="백상지" />
              </FormControl>
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
                <Textarea {...field} placeholder="지종에 대한 설명" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sortOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>정렬순서</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  placeholder="0"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "수정" : "생성"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
