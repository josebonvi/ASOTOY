"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart2,
  Users,
  LogOut,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/formulario", label: "Formulario", icon: ClipboardList },
  { href: "/dashboard/estadisticas", label: "Estadísticas", icon: BarChart2 },
];

const adminItems = [
  { href: "/admin", label: "Administración", icon: Users },
];

export default function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full w-56 flex flex-col z-20"
      style={{
        background: "rgba(10,10,15,0.95)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Logo */}
      <div className="px-4 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{
              background: "rgba(124,107,255,0.2)",
              border: "1px solid rgba(124,107,255,0.3)",
            }}
          >
            🚗
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
              ASOTOY
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Remuneración
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group"
              style={{
                background: active ? "rgba(124,107,255,0.15)" : "transparent",
                color: active ? "var(--primary-light)" : "var(--text-muted)",
                border: active
                  ? "1px solid rgba(124,107,255,0.2)"
                  : "1px solid transparent",
              }}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {active && (
                <ChevronRight size={14} style={{ color: "var(--primary)" }} />
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div
              className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Admin
            </div>
            {adminItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: active ? "rgba(124,107,255,0.15)" : "transparent",
                    color: active ? "var(--primary-light)" : "var(--text-muted)",
                    border: active
                      ? "1px solid rgba(124,107,255,0.2)"
                      : "1px solid transparent",
                  }}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="px-2 pb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#fca5a5";
            (e.currentTarget as HTMLElement).style.background =
              "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
