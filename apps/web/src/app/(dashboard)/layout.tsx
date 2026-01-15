import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ErrorBoundary } from "@/components/error-boundary";
import type { UserRole, AuthUser } from "@repo/shared";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { data: dbUser } = await serviceClient
    .from("users")
    .select("display_name, avatar_url")
    .eq("id", authUser.id)
    .single();

  const { data: userRoles } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", authUser.id);

  const roles: UserRole[] = (userRoles ?? []).map((r) => r.role as UserRole);

  const user: AuthUser = {
    id: authUser.id,
    email: authUser.email ?? "",
    displayName: dbUser?.display_name ?? null,
    avatarUrl: dbUser?.avatar_url ?? null,
    roles,
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRoles={roles} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-auto p-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
