import { supabaseServer } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import RealtimeNotifications from "@/components/ui/RealtimeNotifications";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const role = user.user_metadata?.role;
  if (role !== "agent" && role !== "admin") redirect("/auth/login?error=unauthorized");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-64 flex-1 p-6 min-w-0">{children}</main>
      <RealtimeNotifications />
    </div>
  );
}
