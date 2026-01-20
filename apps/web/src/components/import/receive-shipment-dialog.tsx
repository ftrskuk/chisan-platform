"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ShipmentWithRelations } from "@repo/shared";
import { useReceiveShipment, useWarehouses, useLocations } from "@/hooks/api";
import { toast } from "sonner";
import { Loader2, Package, Warehouse } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

const receiveItemSchema = z.object({
  shipmentItemId: z.string().uuid(),
  receivedQuantity: z.coerce.number().int().min(0),
  damagedQuantity: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional(),
  itemName: z.string(),
  shippedQuantity: z.number(),
});

const receiveFormSchema = z.object({
  locationId: z.string().uuid({ message: "입고 위치를 선택해주세요" }),
  items: z.array(receiveItemSchema).min(1),
  memo: z.string().optional(),
});

type ReceiveFormValues = z.input<typeof receiveFormSchema>;

interface ReceiveShipmentDialogProps {
  shipment: ShipmentWithRelations;
  onSuccess?: () => void;
}

export function ReceiveShipmentDialog({
  shipment,
  onSuccess,
}: ReceiveShipmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");

  const { data: warehouses } = useWarehouses();
  const { data: locations } = useLocations(selectedWarehouseId);
  const receiveMutation = useReceiveShipment();

  const form = useForm<ReceiveFormValues>({
    resolver: zodResolver(receiveFormSchema),
    defaultValues: {
      locationId: "",
      items: shipment.items.map((item) => ({
        shipmentItemId: item.id,
        receivedQuantity: item.shippedQuantity,
        damagedQuantity: 0,
        notes: "",
        itemName: `${item.importOrderItem.item.paperType.nameKo ?? item.importOrderItem.item.paperType.nameEn} (${item.importOrderItem.widthMm}mm)`,
        shippedQuantity: item.shippedQuantity,
      })),
      memo: "",
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (data: ReceiveFormValues) => {
    try {
      await receiveMutation.mutateAsync({
        id: shipment.id,
        data: {
          locationId: data.locationId,
          items: data.items.map((item) => ({
            shipmentItemId: item.shipmentItemId,
            receivedQuantity: item.receivedQuantity,
            damagedQuantity: item.damagedQuantity ?? 0,
            notes: item.notes || undefined,
          })),
          memo: data.memo || undefined,
        },
      });
      toast.success("입고 처리가 완료되었습니다. 재고가 자동으로 등록됩니다.");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "입고 처리 중 오류가 발생했습니다.",
      );
    }
  };

  const isLoading = receiveMutation.isPending;
  const canReceive = shipment.status === "customs_cleared";

  if (!canReceive) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Package className="mr-2 h-4 w-4" />
          입고 처리
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>선적 입고 처리</DialogTitle>
          <DialogDescription>
            선적번호 {shipment.shipmentNumber}의 입고 정보를 입력합니다. 입고
            완료 시 재고가 자동으로 등록됩니다.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FormLabel>창고 선택 *</FormLabel>
                <Select
                  value={selectedWarehouseId}
                  onValueChange={(value) => {
                    setSelectedWarehouseId(value);
                    form.setValue("locationId", "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="창고를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4" />
                          {warehouse.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <FormField
                control={form.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>입고 위치 *</FormLabel>
                    <Select
                      disabled={!selectedWarehouseId}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="위치를 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations?.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.code}
                            {location.name && ` - ${location.name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">품목별 입고 수량</h4>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-4 p-4 border rounded-lg sm:grid-cols-4"
                  >
                    <div className="sm:col-span-2">
                      <p className="text-sm font-medium">{field.itemName}</p>
                      <p className="text-xs text-muted-foreground">
                        선적 수량: {field.shippedQuantity}
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name={`items.${index}.receivedQuantity`}
                      render={({ field: inputField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">입고 수량</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={field.shippedQuantity}
                              {...inputField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.damagedQuantity`}
                      render={({ field: inputField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">파손 수량</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...inputField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>메모</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="입고 관련 메모를 입력하세요"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                입고 완료
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
