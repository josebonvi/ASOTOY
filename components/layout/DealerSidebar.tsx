"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FORMULARIO_SECCIONES } from "@/lib/constants";
import type { FormularioProgreso } from "@/lib/types";
import {
  LayoutDashboard,
  Building2,
  Users,
  DollarSign,
  GraduationCap,
  Target,
  LogOut,
  Check,
  Lock,
  Menu,
  X,
  GitBranch,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  Building2,
  Users,
  DollarSign,
  GraduationCap,
  Target,
};

interface DealerSidebarProps {
  concesionarioNombre: string;
  progreso: FormularioProgreso;
}

export default function DealerSidebar({
  concesionarioNombre,
  progreso,
}: DealerSidebarProps) {
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

  const completedCount = Object.values(progreso).filter(Boolean).length;

  return (
    <>
      {/* Mobile header bar */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 py-3 bg-sidebar border-b border-sidebar-border md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <Image src="/logo.png" alt="ASOTOY" width={100} height={32} className="h-7 w-auto" />
        <span className="text-xs text-muted-foreground truncate ml-auto">{concesionarioNombre}</span>
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
          "fixed left-0 top-0 h-full w-64 flex flex-col z-50 bg-sidebar border-r border-sidebar-border transition-transform duration-200",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b border-sidebar-border flex items-center justify-between">
          <div>
            <Image
              src="/logo.png"
              alt="ASOTOY"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
            <p className="text-xs text-muted-foreground mt-2 truncate">
              {concesionarioNombre}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg hover:bg-accent md:hidden"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dashboard link */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          <Link
            href="/inicio"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === "/inicio"
                ? "bg-primary/15 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <LayoutDashboard size={16} />
            <span>Inicio</span>
          </Link>

          {/* Organigrama */}
          <Link
            href="/organigrama"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === "/organigrama"
                ? "bg-primary/15 text-primary border border-primary/20"
                : progreso.organigrama
                  ? "text-success"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <div className="relative">
              {progreso.organigrama ? (
                <Check size={16} />
              ) : (
                <GitBranch size={16} />
              )}
            </div>
            <span className="flex-1 truncate">Organigrama</span>
            {progreso.organigrama ? (
              <Check size={14} className="text-success" />
            ) : (
              <AlertCircle size={14} className="text-warning" />
            )}
          </Link>

          {/* Separator */}
          <div className="mt-3 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Formulario
          </div>

          {/* Sections */}
          {FORMULARIO_SECCIONES.map((seccion) => {
            const Icon = iconMap[seccion.icono] || Target;
            const isCompleted = progreso[seccion.key];
            const isActive = pathname === `/formulario/${seccion.id}`;
            const isBlocked =
              seccion.requiere && !progreso[seccion.requiere];

            return (
              <Link
                key={seccion.id}
                href={
                  isBlocked
                    ? "#"
                    : `/formulario/${seccion.id}`
                }
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive &&
                    "bg-primary/15 text-primary border border-primary/20",
                  isCompleted &&
                    !isActive &&
                    "text-success",
                  isBlocked &&
                    "opacity-40 cursor-not-allowed",
                  !isActive &&
                    !isCompleted &&
                    !isBlocked &&
                    "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                onClick={(e) => isBlocked && e.preventDefault()}
              >
                <div className="relative">
                  {isBlocked ? (
                    <Lock size={16} />
                  ) : isCompleted ? (
                    <Check size={16} />
                  ) : (
                    <Icon size={16} />
                  )}
                </div>
                <span className="flex-1 truncate">{seccion.titulo}</span>
                <span
                  className={cn(
                    "text-xs font-mono",
                    isCompleted ? "text-success" : "text-muted-foreground"
                  )}
                >
                  {seccion.id}/5
                </span>
              </Link>
            );
          })}

          {/* Progress summary */}
          <div className="mt-4 mx-3 p-3 rounded-lg bg-accent/50 border border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Progreso</span>
              <span className="font-semibold text-foreground">
                {completedCount}/6
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / 6) * 100}%` }}
              />
            </div>
          </div>
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={16} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
