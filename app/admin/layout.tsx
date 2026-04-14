import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/layout/AdminSidebar";
import PageTransition from "@/components/shared/PageTransition";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (roleData?.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex h-full min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 md:ml-80 p-4 pt-16 md:pt-6 md:p-6 overflow-auto">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
