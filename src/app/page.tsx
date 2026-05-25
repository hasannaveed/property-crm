import { supabaseServer } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");
  if (user.user_metadata?.role === "admin") redirect("/admin/dashboard");
  redirect("/agent/dashboard");
}
