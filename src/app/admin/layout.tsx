import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import RealtimeNotifications from "@/components/ui/RealtimeNotifications";
import { ToastProvider } from "@/components/ui/Toast";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/auth/login?error=unauthorized");

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="ml-64 flex-1 p-6 min-w-0">{children}</main>
        <RealtimeNotifications />
      </div>
    </ToastProvider>
  );
}
