"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { useItems, useDeleteItem, usePaperTypes } from "@/hooks/api";
import { DataTable } from "@/components/data-table";
import { itemColumns } from "@/components/items/item-columns";
import { ItemForm } from "@/components/items/item-form";
import { FormSheet } from "@/components/form-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import type { ItemWithRelations } from "@repo/shared";

export default function ItemsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemWithRelations | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ItemWithRelations | null>(
    null,
  );

  const { data: items, isLoading } = useItems();
  const { data: paperTypes } = usePaperTypes();
  const deleteMutation = useDeleteItem();

  const handleEdit = (item: ItemWithRelations) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("품목이 삭제되었습니다.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.",
      );
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingItem(null);
  };

  const columns = itemColumns({
    onEdit: handleEdit,
    onDelete: setDeleteTarget,
  });

  const paperTypeOptions =
    paperTypes?.map((type) => ({
      label: type.nameEn,
      value: type.id,
    })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="품목 관리"
        description="품목(아이템)을 관리합니다."
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            품목 추가
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={items ?? []}
        isLoading={isLoading}
        searchKey="displayName"
        searchPlaceholder="품목명 검색..."
        filterableColumns={[
          {
            id: "paperType",
            title: "지종",
            options: paperTypeOptions,
          },
          {
            id: "form",
            title: "형태",
            options: [
              { label: "롤", value: "roll" },
              { label: "시트", value: "sheet" },
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
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingItem(null);
        }}
        title={editingItem ? "품목 수정" : "새 품목 추가"}
        description={
          editingItem ? "품목 정보를 수정합니다." : "새로운 품목을 추가합니다."
        }
      >
        <ItemForm item={editingItem} onSuccess={handleFormSuccess} />
      </FormSheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="품목 삭제"
        description={`"${deleteTarget?.displayName}" 품목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        variant="destructive"
        confirmText="삭제"
      />
    </div>
  );
}
