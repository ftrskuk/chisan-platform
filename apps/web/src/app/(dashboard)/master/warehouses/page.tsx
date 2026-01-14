"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { useWarehouses, useDeleteWarehouse } from "@/hooks/api";
import { DataTable } from "@/components/data-table";
import { warehouseColumns } from "@/components/warehouses/warehouse-columns";
import { WarehouseForm } from "@/components/warehouses/warehouse-form";
import { FormSheet } from "@/components/form-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import type { Warehouse } from "@repo/shared";

export default function WarehousesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);

  const { data: warehouses, isLoading } = useWarehouses();
  const deleteMutation = useDeleteWarehouse();

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormOpen(true);
  };

  const handleManageLocations = (warehouse: Warehouse) => {
    toast.info(`${warehouse.name} 창고의 로케이션 관리 기능은 준비 중입니다.`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("창고가 삭제되었습니다.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.",
      );
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingWarehouse(null);
  };

  const columns = warehouseColumns({
    onEdit: handleEdit,
    onDelete: setDeleteTarget,
    onManageLocations: handleManageLocations,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="창고 관리"
        description="창고 및 로케이션을 관리합니다."
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            창고 추가
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={warehouses ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="창고명 검색..."
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

      <FormSheet
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingWarehouse(null);
        }}
        title={editingWarehouse ? "창고 수정" : "새 창고 추가"}
        description={
          editingWarehouse
            ? "창고 정보를 수정합니다."
            : "새로운 창고를 추가합니다."
        }
      >
        <WarehouseForm
          warehouse={editingWarehouse}
          onSuccess={handleFormSuccess}
        />
      </FormSheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="창고 삭제"
        description={`"${deleteTarget?.name}" 창고를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        variant="destructive"
        confirmText="삭제"
      />
    </div>
  );
}
