"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { UserWithRoles, UserRole } from "@repo/shared";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "관리자",
  manager: "매니저",
  worker: "작업자",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get<UserWithRoles[]>("/api/v1/users");
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (user: UserWithRoles) => {
    try {
      const endpoint = user.isActive
        ? `/api/v1/users/${user.id}/deactivate`
        : `/api/v1/users/${user.id}/reactivate`;
      await api.patch(endpoint);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const handleAssignRole = async (userId: string, role: UserRole) => {
    try {
      await api.post(`/api/v1/users/${userId}/roles`, { role });
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign role");
    }
  };

  const handleRemoveRole = async (userId: string, role: UserRole) => {
    try {
      await api.delete(`/api/v1/users/${userId}/roles/${role}`);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove role");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          시스템 사용자 목록을 관리하고 역할을 할당합니다.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                사용자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                역할
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                최종 로그인
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onToggleActive={() => handleToggleActive(user)}
                onAssignRole={(role) => handleAssignRole(user.id, role)}
                onRemoveRole={(role) => handleRemoveRole(user.id, role)}
              />
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            등록된 사용자가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

interface UserRowProps {
  user: UserWithRoles;
  onToggleActive: () => void;
  onAssignRole: (role: UserRole) => void;
  onRemoveRole: (role: UserRole) => void;
}

function UserRow({
  user,
  onToggleActive,
  onAssignRole,
  onRemoveRole,
}: UserRowProps) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const availableRoles: UserRole[] = (
    ["admin", "manager", "worker"] as const
  ).filter((role) => !user.roles.includes(role));

  return (
    <tr>
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center">
          {user.avatarUrl ? (
            <img
              className="h-10 w-10 rounded-full"
              src={user.avatarUrl}
              alt=""
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-500">
              {(user.displayName ?? user.email).charAt(0).toUpperCase()}
            </div>
          )}
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {user.displayName ?? "-"}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <span
              key={role}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                role === "admin"
                  ? "bg-red-100 text-red-800"
                  : role === "manager"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {ROLE_LABELS[role]}
              <button
                onClick={() => onRemoveRole(role)}
                className="ml-0.5 hover:opacity-70"
                title="역할 제거"
              >
                ×
              </button>
            </span>
          ))}
          {user.roles.length === 0 && (
            <span className="text-sm text-gray-400">역할 없음</span>
          )}
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
            user.isActive
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {user.isActive ? "활성" : "비활성"}
        </span>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {user.lastLoginAt
          ? new Date(user.lastLoginAt).toLocaleString("ko-KR")
          : "-"}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
        <div className="relative inline-block">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="mr-2 text-blue-600 hover:text-blue-900"
            disabled={availableRoles.length === 0}
          >
            역할 추가
          </button>
          {showRoleMenu && availableRoles.length > 0 && (
            <div className="absolute right-0 z-10 mt-2 w-36 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="py-1">
                {availableRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      onAssignRole(role);
                      setShowRoleMenu(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onToggleActive}
          className={
            user.isActive
              ? "text-red-600 hover:text-red-900"
              : "text-green-600 hover:text-green-900"
          }
        >
          {user.isActive ? "비활성화" : "활성화"}
        </button>
      </td>
    </tr>
  );
}
