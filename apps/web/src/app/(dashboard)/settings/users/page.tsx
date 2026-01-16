"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";

import { useUsers, useToggleUserActive, useRemoveRole } from "@/hooks/api";
import { DataTable } from "@/components/data-table";
import { userColumns } from "@/components/users";
import { RoleAssignmentForm } from "@/components/users";
import { FormSheet } from "@/components/form-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/layout";
import type { UserWithRoles, UserRole } from "@repo/shared";

export default function UsersPage() {
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [toggleConfirm, setToggleConfirm] = useState<UserWithRoles | null>(
    null,
  );
  const [removeRoleConfirm, setRemoveRoleConfirm] = useState<{
    user: UserWithRoles;
    role: UserRole;
  } | null>(null);

  const { data: users, isLoading } = useUsers();
  const toggleMutation = useToggleUserActive();
  const removeMutation = useRemoveRole();

  const handleAssignRole = useCallback((user: UserWithRoles) => {
    setSelectedUser(user);
    setRoleSheetOpen(true);
  }, []);

  const handleConfirmRemoveRole = async () => {
    if (!removeRoleConfirm) return;
    try {
      await removeMutation.mutateAsync({
        userId: removeRoleConfirm.user.id,
        role: removeRoleConfirm.role,
      });
      toast.success("역할이 제거되었습니다.");
      setRemoveRoleConfirm(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "역할 제거 중 오류가 발생했습니다.",
      );
    }
  };

  const handleToggleActive = async () => {
    if (!toggleConfirm) return;
    try {
      await toggleMutation.mutateAsync({
        userId: toggleConfirm.id,
        isActive: toggleConfirm.isActive,
      });
      toast.success(
        toggleConfirm.isActive
          ? "사용자가 비활성화되었습니다."
          : "사용자가 활성화되었습니다.",
      );
      setToggleConfirm(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "상태 변경 중 오류가 발생했습니다.",
      );
    }
  };

  const handleFormSuccess = () => {
    setRoleSheetOpen(false);
    setSelectedUser(null);
  };

  const handleRemoveRole = useCallback(
    (user: UserWithRoles, role: UserRole) =>
      setRemoveRoleConfirm({ user, role }),
    [],
  );

  const columns = useMemo(
    () =>
      userColumns({
        onToggleActive: setToggleConfirm,
        onAssignRole: handleAssignRole,
        onRemoveRole: handleRemoveRole,
      }),
    [handleAssignRole, handleRemoveRole],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="사용자 관리"
        description="시스템 사용자 목록을 관리하고 역할을 할당합니다."
      />

      <DataTable
        columns={columns}
        data={users ?? []}
        isLoading={isLoading}
        searchKey="email"
        searchPlaceholder="이메일 검색..."
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
        open={roleSheetOpen}
        onOpenChange={(open) => {
          setRoleSheetOpen(open);
          if (!open) setSelectedUser(null);
        }}
        title="역할 추가"
        description={
          selectedUser
            ? `${selectedUser.displayName ?? selectedUser.email}에게 역할을 추가합니다.`
            : undefined
        }
      >
        {selectedUser && (
          <RoleAssignmentForm
            user={selectedUser}
            onSuccess={handleFormSuccess}
          />
        )}
      </FormSheet>

      <ConfirmDialog
        open={!!toggleConfirm}
        onOpenChange={(open) => !open && setToggleConfirm(null)}
        title={toggleConfirm?.isActive ? "사용자 비활성화" : "사용자 활성화"}
        description={
          toggleConfirm?.isActive
            ? `"${toggleConfirm?.displayName ?? toggleConfirm?.email}" 사용자를 비활성화하시겠습니까?`
            : `"${toggleConfirm?.displayName ?? toggleConfirm?.email}" 사용자를 활성화하시겠습니까?`
        }
        onConfirm={handleToggleActive}
        isLoading={toggleMutation.isPending}
        variant={toggleConfirm?.isActive ? "destructive" : "default"}
        confirmText={toggleConfirm?.isActive ? "비활성화" : "활성화"}
      />

      <ConfirmDialog
        open={!!removeRoleConfirm}
        onOpenChange={(open) => !open && setRemoveRoleConfirm(null)}
        title="역할 제거"
        description={`"${removeRoleConfirm?.user.displayName ?? removeRoleConfirm?.user.email}"에서 ${removeRoleConfirm?.role} 역할을 제거하시겠습니까?`}
        onConfirm={handleConfirmRemoveRole}
        isLoading={removeMutation.isPending}
        variant="destructive"
        confirmText="제거"
      />
    </div>
  );
}
