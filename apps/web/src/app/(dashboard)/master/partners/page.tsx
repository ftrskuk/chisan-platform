"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { usePartners, useDeletePartner } from "@/hooks/api";
import { useCRUDState } from "@/hooks/use-crud-state";
import { DataTable } from "@/components/data-table";
import { partnerColumns } from "@/components/partners/partner-columns";
import { PartnerForm } from "@/components/partners/partner-form";
import { FormSheet } from "@/components/form-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import type { Partner } from "@repo/shared";

export default function PartnersPage() {
  const {
    formOpen,
    editing: editingPartner,
    deleteTarget,
    openCreate,
    openEdit,
    closeForm,
    openDelete,
    closeDelete,
    handleFormOpenChange,
    handleDeleteOpenChange,
  } = useCRUDState<Partner>();

  const router = useRouter();

  const { data: partners, isLoading } = usePartners();
  const deleteMutation = useDeletePartner();

  const handleManageBrands = (partner: Partner) => {
    router.push(`/master/partners/${partner.id}/brands`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("거래처가 삭제되었습니다.");
      closeDelete();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.",
      );
    }
  };

  const columns = partnerColumns({
    onEdit: openEdit,
    onDelete: openDelete,
    onManageBrands: handleManageBrands,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="거래처 관리"
        description="공급업체 및 고객 거래처를 관리합니다."
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            거래처 추가
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={partners ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="거래처명 검색..."
        filterableColumns={[
          {
            id: "partnerType",
            title: "유형",
            options: [
              { label: "공급업체", value: "supplier" },
              { label: "고객", value: "customer" },
              { label: "공급/고객", value: "both" },
            ],
          },
          {
            id: "isActive",
            title: "상태",
            options: [
              { label: "활성", value: "true" },
              { label: "비활성", value: "false" },
            ],
          },
        ]}
      />

      <FormSheet
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        title={editingPartner ? "거래처 수정" : "새 거래처 추가"}
        description={
          editingPartner
            ? "거래처 정보를 수정합니다."
            : "새로운 거래처를 추가합니다."
        }
      >
        <PartnerForm partner={editingPartner} onSuccess={closeForm} />
      </FormSheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={handleDeleteOpenChange}
        title="거래처 삭제"
        description={`"${deleteTarget?.name}" 거래처를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        variant="destructive"
        confirmText="삭제"
      />
    </div>
  );
}
