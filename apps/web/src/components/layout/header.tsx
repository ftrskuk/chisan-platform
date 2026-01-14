"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@repo/shared";

interface HeaderProps {
  user: AuthUser;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const roleLabel = user.roles.includes("admin")
    ? "관리자"
    : user.roles.includes("manager")
      ? "매니저"
      : "작업자";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div />

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">
            {user.displayName ?? user.email}
          </p>
          <p className="text-xs text-muted-foreground">{roleLabel}</p>
        </div>

        {user.avatarUrl && (
          <img
            src={user.avatarUrl}
            alt={user.displayName ?? "User"}
            className="h-8 w-8 rounded-full"
          />
        )}

        <button
          onClick={handleLogout}
          className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
