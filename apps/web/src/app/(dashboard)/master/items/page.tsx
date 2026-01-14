"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { useItems, useDeleteItem, usePaperTypes } from "@/hooks/api";
import { DataTable } from "@/components/data-table";
import { itemColumns } from "@/components/items/item-columns";
import { paperTypeColumns } from "@/components/items/paper-type-columns";
import { ItemForm } from "@/components/items/item-form";
import { PaperTypeForm } from "@/components/items/paper-type-form";
import { FormSheet } from "@/components/form-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ItemWithRelations, PaperType } from "@repo/shared";

export default function ItemsPage() {
  const [activeTab, setActiveTab] = useState("items");

  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemWithRelations | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ItemWithRelations | null>(
    null,
  );

  const [paperTypeFormOpen, setPaperTypeFormOpen] = useState(false);
  const [editingPaperType, setEditingPaperType] = useState<PaperType | null>(
    null,
  );

  const { data: items, isLoading: itemsLoading } = useItems();
  const { data: paperTypes, isLoading: paperTypesLoading } = usePaperTypes();
  const deleteMutation = useDeleteItem();

  const handleEditItem = (item: ItemWithRelations) => {
    setEditingItem(item);
    setItemFormOpen(true);
  };

  const handleDeleteItem = async () => {
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

  const handleItemFormSuccess = () => {
    setItemFormOpen(false);
    setEditingItem(null);
  };

  const handleEditPaperType = (paperType: PaperType) => {
    setEditingPaperType(paperType);
    setPaperTypeFormOpen(true);
  };

  const handlePaperTypeFormSuccess = () => {
    setPaperTypeFormOpen(false);
    setEditingPaperType(null);
  };

  const itemColumnsConfig = itemColumns({
    onEdit: handleEditItem,
    onDelete: setDeleteTarget,
  });

  const paperTypeColumnsConfig = paperTypeColumns({
    onEdit: handleEditPaperType,
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
        description="품목(아이템) 및 지종(Paper Type)을 관리합니다."
        action={
          activeTab === "items" ? (
            <Button onClick={() => setItemFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              품목 추가
            </Button>
          ) : (
            <Button onClick={() => setPaperTypeFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              지종 추가
            </Button>
          )
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="items">품목</TabsTrigger>
          <TabsTrigger value="paper-types">지종</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-4">
          <DataTable
            columns={itemColumnsConfig}
            data={items ?? []}
            isLoading={itemsLoading}
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
        </TabsContent>

        <TabsContent value="paper-types" className="mt-4">
          <DataTable
            columns={paperTypeColumnsConfig}
            data={paperTypes ?? []}
            isLoading={paperTypesLoading}
            searchKey="nameEn"
            searchPlaceholder="지종명 검색..."
            filterableColumns={[
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
        </TabsContent>
      </Tabs>

      <FormSheet
        open={itemFormOpen}
        onOpenChange={(open) => {
          setItemFormOpen(open);
          if (!open) setEditingItem(null);
        }}
        title={editingItem ? "품목 수정" : "새 품목 추가"}
        description={
          editingItem ? "품목 정보를 수정합니다." : "새로운 품목을 추가합니다."
        }
      >
        <ItemForm item={editingItem} onSuccess={handleItemFormSuccess} />
      </FormSheet>

      <FormSheet
        open={paperTypeFormOpen}
        onOpenChange={(open) => {
          setPaperTypeFormOpen(open);
          if (!open) setEditingPaperType(null);
        }}
        title={editingPaperType ? "지종 수정" : "새 지종 추가"}
        description={
          editingPaperType
            ? "지종 정보를 수정합니다."
            : "새로운 지종을 추가합니다."
        }
      >
        <PaperTypeForm
          paperType={editingPaperType}
          onSuccess={handlePaperTypeFormSuccess}
        />
      </FormSheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="품목 삭제"
        description={`"${deleteTarget?.displayName}" 품목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={handleDeleteItem}
        isLoading={deleteMutation.isPending}
        variant="destructive"
        confirmText="삭제"
      />
    </div>
  );
}
