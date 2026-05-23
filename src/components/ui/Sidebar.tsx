"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Building2,
  LayoutDashboard,
  Users,
  BarChart3,
  Activity,
  Bell,
  List,
  LogOut,
  Home,
} from "lucide-react";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads", label: "All Leads", icon: List },
  { href: "/admin/inventory", label: "Inventory", icon: Home },
  { href: "/admin/agents", label: "Agents", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/activity", label: "Activity Log", icon: Activity },
  { href: "/admin/reminders", label: "Reminders", icon: Bell },
];

const agentLinks = [
  { href: "/agent/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agent/leads", label: "My Leads", icon: List },
  { href: "/agent/reminders", label: "Reminders", icon: Bell },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const links = role === "admin" ? adminLinks : agentLinks;

  return (
    <aside className="fixed left-0 top-0 w-64 min-h-screen bg-slate-900 flex flex-col z-30">
      <div className="px-5 pt-6 pb-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Property CRM</p>
            <p className="text-indigo-400 text-xs capitalize">{role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-5 border-t border-slate-700 pt-4">
        <div className="mb-3">
          <p className="text-white text-sm font-medium truncate">{session?.user?.name}</p>
          <p className="text-slate-400 text-xs truncate">{session?.user?.email}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
