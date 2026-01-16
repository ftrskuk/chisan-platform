"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createItemSchema,
  type CreateItemInput,
  type ItemWithRelations,
  ITEM_FORMS,
} from "@repo/shared";
import {
  useCreateItem,
  useUpdateItem,
  usePaperTypes,
  useBrands,
} from "@/hooks/api";
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
import { Separator } from "@/components/ui/separator";

interface ItemFormProps {
  item?: ItemWithRelations | null;
  onSuccess: () => void;
}

const formLabels: Record<string, string> = {
  roll: "롤",
  sheet: "시트",
};

export function ItemForm({ item, onSuccess }: ItemFormProps) {
  const isEditing = !!item;

  const { data: paperTypes } = usePaperTypes();
  const { data: brands } = useBrands();

  const form = useForm<CreateItemInput>({
    resolver: zodResolver(createItemSchema),
    defaultValues: item
      ? {
          itemCode: item.itemCode ?? undefined,
          displayName: item.displayName,
          paperTypeId: item.paperTypeId,
          brandId: item.brandId ?? undefined,
          grammage: item.grammage,
          form: item.form,
          coreDiameterInch: item.coreDiameterInch ?? undefined,
          lengthMm: item.lengthMm ?? undefined,
          sheetsPerReam: item.sheetsPerReam ?? undefined,
          unitOfMeasure: item.unitOfMeasure ?? undefined,
          notes: item.notes ?? undefined,
        }
      : {
          displayName: "",
          paperTypeId: "",
          grammage: 80,
          form: "roll",
          unitOfMeasure: "kg",
        },
  });

  const itemForm = useWatch({ control: form.control, name: "form" });
  const isRoll = itemForm === "roll";
  const isSheet = itemForm === "sheet";

  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem(item?.id ?? "");

  const onSubmit = async (data: CreateItemInput) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
        toast.success("품목이 수정되었습니다.");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("품목이 생성되었습니다.");
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
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>품목명 *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Woodfree 80gsm 1000mm Roll" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="paperTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>지종 *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="지종 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paperTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.nameEn} {type.nameKo && `(${type.nameKo})`}
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
            name="brandId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>브랜드</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="브랜드 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {brands?.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="grammage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>평량 (g/m²) *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="80"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="form"
            render={({ field }) => (
              <FormItem>
                <FormLabel>형태 *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="형태 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ITEM_FORMS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {formLabels[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {isRoll && (
          <FormField
            control={form.control}
            name="coreDiameterInch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>지관 직경 (inch)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.5"
                    placeholder="3"
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {isSheet && (
          <>
            <FormField
              control={form.control}
              name="lengthMm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>길이 (mm) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="700"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined,
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
              name="sheetsPerReam"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>연당 매수</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="500"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <Separator />

        <FormField
          control={form.control}
          name="unitOfMeasure"
          render={({ field }) => (
            <FormItem>
              <FormLabel>단위</FormLabel>
              <FormControl>
                <Input {...field} placeholder="kg" />
              </FormControl>
              <FormMessage />
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
