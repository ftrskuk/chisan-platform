"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Plus } from "lucide-react";
import { toast } from "sonner";

import { usePartner, useDeleteBrand } from "@/hooks/api";
import { DataTable } from "@/components/data-table";
import { brandColumns } from "@/components/partners/brand-columns";
import { BrandForm } from "@/components/partners/brand-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Brand } from "@repo/shared";

export default function PartnerBrandsPage() {
  const params = useParams<{ id: string }>();
  const partnerId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [formOpen, setFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);

  const { data: partner, isLoading } = usePartner(partnerId ?? "");
  const deleteMutation = useDeleteBrand(partnerId ?? "");

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("브랜드가 삭제되었습니다.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.",
      );
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingBrand(null);
  };

  const columns = brandColumns({
    onEdit: handleEdit,
    onDelete: setDeleteTarget,
  });

  const brands = partner?.brands ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="mt-1">
          <Link href="/master/partners">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <PageHeader
            title={`${partner?.name ?? "거래처"} - 브랜드 관리`}
            description="거래처별 브랜드를 관리합니다."
            action={
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                브랜드 추가
              </Button>
            }
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={brands}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="브랜드명 검색..."
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

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingBrand(null);
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              {editingBrand ? "브랜드 수정" : "새 브랜드 추가"}
            </DialogTitle>
            <DialogDescription>
              {editingBrand
                ? "브랜드 정보를 수정합니다."
                : "새로운 브랜드를 추가합니다."}
            </DialogDescription>
          </DialogHeader>
          {partnerId && (
            <BrandForm
              partnerId={partnerId}
              brand={editingBrand}
              onSuccess={handleFormSuccess}
              onCancel={() => setFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="브랜드 삭제"
        description={`"${deleteTarget?.name}" 브랜드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        variant="destructive"
        confirmText="삭제"
      />
    </div>
  );
}
