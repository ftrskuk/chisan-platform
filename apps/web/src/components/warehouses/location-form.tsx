"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createLocationSchema,
  type CreateLocationInput,
  type Location,
  LOCATION_TYPES,
  type LocationType,
} from "@repo/shared";
import { useCreateLocation, useUpdateLocation } from "@/hooks/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LocationFormProps {
  warehouseId: string;
  location?: Location | null;
  locations?: Location[];
  onSuccess: () => void;
}

const locationTypeLabels: Record<LocationType, string> = {
  default: "기본",
  zone: "구역",
  rack: "랙",
  shelf: "선반",
  floor: "층",
};

export function LocationForm({
  warehouseId,
  location,
  locations = [],
  onSuccess,
}: LocationFormProps) {
  const isEditing = !!location;

  const form = useForm<CreateLocationInput>({
    resolver: zodResolver(createLocationSchema),
    defaultValues: location
      ? {
          code: location.code,
          name: location.name ?? undefined,
          type: location.type,
          parentId: location.parentId ?? undefined,
          notes: location.notes ?? undefined,
        }
      : {
          code: "",
          type: "default",
        },
  });

  const createMutation = useCreateLocation(warehouseId);
  const updateMutation = useUpdateLocation(warehouseId);

  const onSubmit = async (data: CreateLocationInput) => {
    try {
      if (isEditing && location) {
        await updateMutation.mutateAsync({ id: location.id, data });
        toast.success("로케이션이 수정되었습니다.");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("로케이션이 생성되었습니다.");
      }
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "오류가 발생했습니다.",
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const availableParents = locations.filter((l) => l.id !== location?.id);

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
                  placeholder="A-01"
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
              <FormLabel>이름</FormLabel>
              <FormControl>
                <Input {...field} placeholder="1층 A구역" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>유형</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="유형 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LOCATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {locationTypeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {availableParents.length > 0 && (
          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>상위 로케이션</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="상위 로케이션 선택 (선택사항)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableParents.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.code} {loc.name && `- ${loc.name}`}
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
