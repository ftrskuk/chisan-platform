"use client";

import { useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, Package, Ruler, AlertCircle } from "lucide-react";
import { z } from "zod";

import {
  useCreateSlittingJobV2,
  useMachines,
  useItems,
  useUsers,
} from "@/hooks/api";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LoadingButton } from "@/components/loading-button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const plannedOutputSchema = z.object({
  itemId: z.string().min(1, "품목을 선택하세요"),
  widthMm: z.coerce.number().int().min(50).max(2500),
  quantity: z.coerce.number().int().positive(),
  notes: z.string().max(500).optional(),
});

const jobFormV2Schema = z.object({
  machineId: z.string().min(1, "기계를 선택하세요"),
  itemId: z.string().min(1, "품목을 선택하세요"),
  parentWidthMm: z.coerce.number().int().min(50).max(2500),
  plannedRollCount: z.coerce.number().int().min(1).max(100),
  plannedOutputs: z.array(plannedOutputSchema).min(1).max(50),
  operatorId: z.string().optional(),
  sequenceNumber: z.coerce.number().int().min(1).optional(),
  memo: z.string().max(1000).optional(),
});

type JobFormV2Values = z.infer<typeof jobFormV2Schema>;

interface JobFormV2Props {
  scheduleId: string;
  onSuccess: () => void;
}

export function JobFormV2({ scheduleId, onSuccess }: JobFormV2Props) {
  const createJob = useCreateSlittingJobV2();

  const { data: machinesResponse } = useMachines();
  const { data: items } = useItems({ isActive: true });
  const { data: users } = useUsers();

  const machines = useMemo(
    () => machinesResponse?.data ?? [],
    [machinesResponse?.data],
  );
  const activeItems = useMemo(() => items ?? [], [items]);
  const activeUsers = useMemo(
    () => users?.filter((u) => u.isActive) ?? [],
    [users],
  );

  const form = useForm<JobFormV2Values>({
    resolver: zodResolver(jobFormV2Schema),
    defaultValues: {
      machineId: "",
      itemId: "",
      parentWidthMm: 1000,
      plannedRollCount: 1,
      plannedOutputs: [{ itemId: "", widthMm: 500, quantity: 1, notes: "" }],
      operatorId: undefined,
      sequenceNumber: undefined,
      memo: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "plannedOutputs",
  });

  const parentWidthMm = form.watch("parentWidthMm");
  const plannedOutputs = form.watch("plannedOutputs");
  const selectedItemId = form.watch("itemId");

  const selectedItem = useMemo(
    () => activeItems.find((i) => i.id === selectedItemId),
    [activeItems, selectedItemId],
  );

  const totalPlannedWidth = useMemo(() => {
    return plannedOutputs.reduce(
      (sum, o) => sum + (o.widthMm || 0) * (o.quantity || 0),
      0,
    );
  }, [plannedOutputs]);

  const widthUtilization = useMemo(() => {
    if (!parentWidthMm) return 0;
    return (totalPlannedWidth / parentWidthMm) * 100;
  }, [totalPlannedWidth, parentWidthMm]);

  const addOutput = () => {
    append({
      itemId: selectedItemId || "",
      widthMm: 200,
      quantity: 1,
      notes: "",
    });
  };

  const onSubmit = async (data: JobFormV2Values) => {
    const submitData = {
      ...data,
      scheduleId,
      operatorId: data.operatorId === "__none__" ? undefined : data.operatorId,
    };

    try {
      await createJob.mutateAsync(submitData);
      toast.success("V2 작업이 추가되었습니다.");
      form.reset();
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "작업 추가에 실패했습니다.",
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="machineId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>기계 선택 *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="기계를 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {machines.map((machine) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.name}
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
          name="itemId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>원지 품목 *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="품목을 선택하세요" />
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
              <FormDescription>
                V2에서는 재고가 아닌 품목을 선택합니다. 실제 재고는 작업 시
                등록합니다.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedItem && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {selectedItem.paperType?.nameKo ??
                    selectedItem.paperType?.nameEn}{" "}
                  {selectedItem.grammage}g
                </span>
                {selectedItem.brand && (
                  <span className="text-muted-foreground">
                    ({selectedItem.brand.name})
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="parentWidthMm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>원지 폭 (mm) *</FormLabel>
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
            name="plannedRollCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>예정 롤 수 *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? 1 : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel className="text-base">계획 산출물 *</FormLabel>
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
              <Card key={field.id}>
                <CardContent className="pt-4 pb-3">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5">
                      <FormField
                        control={form.control}
                        name={`plannedOutputs.${index}.itemId`}
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
                                    {item.displayName} {item.grammage}g
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`plannedOutputs.${index}.widthMm`}
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
                        name={`plannedOutputs.${index}.quantity`}
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

                    <div className="col-span-2 flex justify-end pb-1">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="bg-blue-50/50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Ruler className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                폭 활용 분석
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">원지 폭</p>
                <p className="font-medium">{parentWidthMm || 0} mm</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">계획 합계</p>
                <p className="font-medium">{totalPlannedWidth} mm</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">활용률</p>
                <p
                  className={`font-medium ${
                    widthUtilization > 100
                      ? "text-red-600"
                      : widthUtilization > 90
                        ? "text-green-600"
                        : "text-amber-600"
                  }`}
                >
                  {widthUtilization.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {widthUtilization > 100 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              계획 산출물 폭 합계가 원지 폭을 초과합니다.
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        <FormField
          control={form.control}
          name="operatorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>작업자 (선택)</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? "__none__"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="작업자를 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none__">선택 안함</SelectItem>
                  {activeUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.displayName ?? user.email}
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
          name="sequenceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>작업 순서 (선택)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder="자동 부여됩니다"
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
          name="memo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>메모 (선택)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="작업 관련 메모를 입력하세요..."
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

        <LoadingButton
          type="submit"
          className="w-full"
          loading={createJob.isPending}
        >
          V2 작업 추가
        </LoadingButton>
      </form>
    </Form>
  );
}
