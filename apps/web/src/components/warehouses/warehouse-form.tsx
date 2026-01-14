"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createWarehouseSchema,
  type CreateWarehouseInput,
  type Warehouse,
} from "@repo/shared";
import { useCreateWarehouse, useUpdateWarehouse } from "@/hooks/api";
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
import { Switch } from "@/components/ui/switch";

interface WarehouseFormProps {
  warehouse?: Warehouse | null;
  onSuccess: () => void;
}

export function WarehouseForm({ warehouse, onSuccess }: WarehouseFormProps) {
  const isEditing = !!warehouse;

  const form = useForm<CreateWarehouseInput>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: warehouse
      ? {
          code: warehouse.code,
          name: warehouse.name,
          address: warehouse.address ?? undefined,
          city: warehouse.city ?? undefined,
          postalCode: warehouse.postalCode ?? undefined,
          contactName: warehouse.contactName ?? undefined,
          contactPhone: warehouse.contactPhone ?? undefined,
          isDefault: warehouse.isDefault,
          notes: warehouse.notes ?? undefined,
        }
      : {
          code: "",
          name: "",
          isDefault: false,
        },
  });

  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse(warehouse?.id ?? "");

  const onSubmit = async (data: CreateWarehouseInput) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
        toast.success("창고가 수정되었습니다.");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("창고가 생성되었습니다.");
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
              <FormLabel>창고 코드 *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="WH-001"
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
              <FormLabel>창고명 *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="본사 창고" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>주소</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="주소를 입력하세요" rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>도시</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="서울" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>우편번호</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="12345" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>담당자</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="홍길동" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>연락처</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="010-1234-5678" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>기본 창고</FormLabel>
                <div className="text-sm text-muted-foreground">
                  신규 입고 시 기본으로 선택되는 창고
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>메모</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="메모를 입력하세요" rows={3} />
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
