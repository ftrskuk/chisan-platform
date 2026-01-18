"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssignRole } from "@/hooks/api";
import { USER_ROLES } from "@repo/shared";
import type { UserWithRoles, UserRole } from "@repo/shared";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "관리자",
  manager: "매니저",
  worker: "작업자",
};

interface RoleAssignmentFormProps {
  user: UserWithRoles;
  onSuccess: () => void;
}

export function RoleAssignmentForm({
  user,
  onSuccess,
}: RoleAssignmentFormProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const assignMutation = useAssignRole();

  const availableRoles = USER_ROLES.filter(
    (role) => !user.roles.includes(role),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    try {
      await assignMutation.mutateAsync({ userId: user.id, role: selectedRole });
      toast.success(`${ROLE_LABELS[selectedRole]} 역할이 추가되었습니다.`);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "역할 추가 중 오류가 발생했습니다.",
      );
    }
  };

  if (availableRoles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        이 사용자에게 할당 가능한 역할이 없습니다.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">역할 선택</label>
        <Select
          value={selectedRole}
          onValueChange={(value) => setSelectedRole(value as UserRole)}
        >
          <SelectTrigger>
            <SelectValue placeholder="역할을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="submit"
        disabled={!selectedRole || assignMutation.isPending}
        className="w-full"
      >
        {assignMutation.isPending ? "추가 중..." : "역할 추가"}
      </Button>
    </form>
  );
}
