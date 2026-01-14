"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { useWarehouse, useDeleteLocation } from "@/hooks/api";
import { DataTable } from "@/components/data-table";
import { locationColumns } from "./location-columns";
import { LocationForm } from "./location-form";
import { FormSheet } from "@/components/form-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Warehouse, Location } from "@repo/shared";

interface LocationsDialogProps {
  warehouse: Warehouse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LocationsDialog({
  warehouse,
  open,
  onOpenChange,
}: LocationsDialogProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);

  const { data: warehouseData, isLoading } = useWarehouse(warehouse?.id ?? "");
  const deleteMutation = useDeleteLocation(warehouse?.id ?? "");

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("로케이션이 삭제되었습니다.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.",
      );
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingLocation(null);
  };

  const columns = locationColumns({
    onEdit: handleEdit,
    onDelete: setDeleteTarget,
  });

  const locations = warehouseData?.locations ?? [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{warehouse?.name} - 로케이션 관리</DialogTitle>
            <DialogDescription>
              창고 내 로케이션(구역, 랙, 선반 등)을 관리합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button onClick={() => setFormOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              로케이션 추가
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={locations}
              isLoading={false}
              searchKey="code"
              searchPlaceholder="로케이션 코드 검색..."
              pageSize={5}
            />
          )}
        </DialogContent>
      </Dialog>

      <FormSheet
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingLocation(null);
        }}
        title={editingLocation ? "로케이션 수정" : "새 로케이션 추가"}
        description={
          editingLocation
            ? "로케이션 정보를 수정합니다."
            : "새로운 로케이션을 추가합니다."
        }
      >
        {warehouse && (
          <LocationForm
            warehouseId={warehouse.id}
            location={editingLocation}
            locations={locations}
            onSuccess={handleFormSuccess}
          />
        )}
      </FormSheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="로케이션 삭제"
        description={`"${deleteTarget?.code}" 로케이션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        variant="destructive"
        confirmText="삭제"
      />
    </>
  );
}
