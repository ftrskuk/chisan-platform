"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createBrandSchema,
  type CreateBrandInput,
  type Brand,
} from "@repo/shared";
import { useCreateBrand, useUpdateBrand } from "@/hooks/api";
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

interface BrandFormProps {
  partnerId: string;
  brand?: Brand | null;
  onSuccess: () => void;
}

export function BrandForm({ partnerId, brand, onSuccess }: BrandFormProps) {
  const isEditing = !!brand;

  const form = useForm<CreateBrandInput>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: brand
      ? {
          code: brand.code,
          name: brand.name,
          description: brand.description ?? undefined,
        }
      : {
          code: "",
          name: "",
        },
  });

  const createMutation = useCreateBrand(partnerId);
  const updateMutation = useUpdateBrand(partnerId);

  const onSubmit = async (data: CreateBrandInput) => {
    try {
      if (isEditing && brand) {
        await updateMutation.mutateAsync({ id: brand.id, data });
        toast.success("브랜드가 수정되었습니다.");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("브랜드가 생성되었습니다.");
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
              <FormLabel>브랜드 코드 *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="BR-001"
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>브랜드명 *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Chisan Premium" />
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
                <Textarea
                  {...field}
                  placeholder="브랜드 설명을 입력하세요"
                  rows={3}
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
