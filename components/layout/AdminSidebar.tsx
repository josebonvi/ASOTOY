"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Download,
  LogOut,
  Menu,
  X,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/organigramas", label: "Organigramas", icon: Network },
  { href: "/admin/concesionarios", label: "Concesionarios", icon: Building2 },
  { href: "/admin/resultados", label: "Resultados", icon: BarChart3 },
  { href: "/admin/exportar", label: "Exportar", icon: Download },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Mobile header bar */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 py-3 bg-sidebar border-b border-sidebar-border md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Image src="/logo-icon.png" alt="ASOTOY" width={32} height={32} className="h-8 w-auto" />
          <span className="text-sm font-bold tracking-wider text-white">ASOTOY</span>
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-80 flex flex-col z-50 bg-sidebar border-r border-sidebar-border transition-transform duration-200",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="px-4 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/logo-icon.png"
                alt="ASOTOY"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
              <span className="text-sm font-bold tracking-wider text-white">ASOTOY</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Panel Administrativo
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg hover:bg-accent md:hidden"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Separador decorativo */}
        <div className="h-px mx-4 bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {/* Indicador lateral activo */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-full" />
                )}
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
          >
            <LogOut size={16} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
