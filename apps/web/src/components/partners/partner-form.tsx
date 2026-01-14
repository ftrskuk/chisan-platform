"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPartnerSchema,
  type CreatePartnerInput,
  type Partner,
  PARTNER_TYPES,
} from "@repo/shared";
import { useCreatePartner, useUpdatePartner } from "@/hooks/api";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PartnerFormProps {
  partner?: Partner | null;
  onSuccess: () => void;
}

const partnerTypeLabels: Record<string, string> = {
  supplier: "공급업체",
  customer: "고객",
  both: "공급/고객",
};

export function PartnerForm({ partner, onSuccess }: PartnerFormProps) {
  const isEditing = !!partner;

  const form = useForm<CreatePartnerInput>({
    resolver: zodResolver(createPartnerSchema),
    defaultValues: partner
      ? {
          partnerCode: partner.partnerCode,
          name: partner.name,
          nameLocal: partner.nameLocal ?? "",
          partnerType: partner.partnerType,
          countryCode: partner.countryCode,
          address: partner.address ?? "",
          city: partner.city ?? "",
          contactName: partner.contactName ?? "",
          contactEmail: partner.contactEmail ?? "",
          contactPhone: partner.contactPhone ?? "",
          supplierCurrency: partner.supplierCurrency ?? "",
          supplierPaymentTerms: partner.supplierPaymentTerms ?? "",
          leadTimeDays: partner.leadTimeDays ?? undefined,
          customerCurrency: partner.customerCurrency ?? "",
          customerPaymentTerms: partner.customerPaymentTerms ?? "",
          creditLimit: partner.creditLimit ?? undefined,
          notes: partner.notes ?? "",
        }
      : {
          partnerCode: "",
          name: "",
          nameLocal: "",
          partnerType: "supplier",
          countryCode: "",
          address: "",
          city: "",
          contactName: "",
          contactEmail: "",
          contactPhone: "",
          supplierCurrency: "",
          supplierPaymentTerms: "",
          leadTimeDays: undefined,
          customerCurrency: "",
          customerPaymentTerms: "",
          creditLimit: undefined,
          notes: "",
        },
  });

  const partnerType = useWatch({ control: form.control, name: "partnerType" });
  const showSupplierFields =
    partnerType === "supplier" || partnerType === "both";
  const showCustomerFields =
    partnerType === "customer" || partnerType === "both";

  const createMutation = useCreatePartner();
  const updateMutation = useUpdatePartner(partner?.id ?? "");

  const onSubmit = async (data: CreatePartnerInput) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
        toast.success("거래처가 수정되었습니다.");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("거래처가 생성되었습니다.");
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
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">기본정보</TabsTrigger>
            <TabsTrigger value="contact">담당자</TabsTrigger>
            <TabsTrigger value="terms">거래조건</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="partnerCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>거래처 코드 *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="SUP-001"
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
                name="partnerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>유형 *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="유형 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PARTNER_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {partnerTypeLabels[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>거래처명 *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ABC Trading Co." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nameLocal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>현지 명칭</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="ABC 트레이딩"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>국가 코드 *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="KR"
                        maxLength={2}
                        className="uppercase"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>도시</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="서울"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>주소</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="주소를 입력하세요"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="contact" className="mt-4 space-y-4">
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>담당자</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="홍길동"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="email"
                      placeholder="contact@example.com"
                    />
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
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="010-1234-5678"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="terms" className="mt-4 space-y-4">
            {showSupplierFields && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="supplierCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>통화</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="USD"
                            maxLength={3}
                            className="uppercase"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supplierPaymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>결제 조건</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Net 30"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="leadTimeDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>리드타임 (일)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="30"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {showCustomerFields && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="customerCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>통화</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="KRW"
                            maxLength={3}
                            className="uppercase"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerPaymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>결제 조건</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="익월말"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="creditLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>여신한도</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10000000"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>메모</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="메모를 입력하세요"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

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
