import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FORMULARIO_SECCIONES } from "@/lib/constants";
import type { FormularioProgreso } from "@/lib/types";
import Link from "next/link";
import {
  Building2,
  Users,
  DollarSign,
  GraduationCap,
  Target,
  Check,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, React.ElementType> = {
  Building2,
  Users,
  DollarSign,
  GraduationCap,
  Target,
};

export default async function DealerDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: concesionario } = await supabase
    .from("concesionarios")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!concesionario) redirect("/login");

  const progreso = (concesionario.formulario_progreso as FormularioProgreso) ?? {
    seccion1: false,
    seccion2: false,
    seccion3: false,
    seccion4: false,
    seccion5: false,
  };

  const completedCount = Object.values(progreso).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 5) * 100);

  // Find next incomplete section
  const nextSection = FORMULARIO_SECCIONES.find((s) => !progreso[s.key]);
  const nextHref = nextSection
    ? `/formulario/${nextSection.id}`
    : "/formulario/confirmacion";

  return (
    <div className="max-w-4xl">
      {/* Welcome banner */}
      <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-6 mb-6">
        <h1 className="text-2xl font-bold text-primary-foreground">
          Bienvenido, {concesionario.nombre}
        </h1>
        <p className="text-primary-foreground/80 mt-1 text-sm">
          Estudio de Remuneración — Red de Concesionarios Toyota Venezuela
        </p>
        <Link href={nextHref}>
          <Button
            variant="secondary"
            className="mt-4 bg-white text-primary hover:bg-white/90 font-semibold"
          >
            {completedCount === 0
              ? "Comenzar formulario"
              : completedCount === 5
                ? "Ver confirmación"
                : "Continuar donde te quedaste"}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl p-5 bg-card border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Progreso
          </p>
          <p className="text-3xl font-bold text-primary">{progressPercent}%</p>
        </div>
        <div className="rounded-xl p-5 bg-card border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Secciones completadas
          </p>
          <p className="text-3xl font-bold text-foreground">
            {completedCount}{" "}
            <span className="text-base text-muted-foreground font-normal">
              / 5
            </span>
          </p>
        </div>
        <div className="rounded-xl p-5 bg-card border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Estado
          </p>
          <p className="text-lg font-semibold capitalize">
            {concesionario.formulario_estado === "pendiente" && (
              <span className="text-warning">Pendiente</span>
            )}
            {concesionario.formulario_estado === "en_progreso" && (
              <span className="text-warning">En progreso</span>
            )}
            {concesionario.formulario_estado === "completado" && (
              <span className="text-success">Completado</span>
            )}
          </p>
        </div>
      </div>

      {/* Section list */}
      <div className="rounded-xl bg-card border border-border p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Secciones del formulario
        </h3>
        <div className="flex flex-col gap-2">
          {FORMULARIO_SECCIONES.map((seccion) => {
            const Icon = iconMap[seccion.icono] || Target;
            const isCompleted = progreso[seccion.key];
            const isBlocked =
              seccion.requiere && !progreso[seccion.requiere];

            return (
              <Link
                key={seccion.id}
                href={
                  isBlocked
                    ? `/inicio`
                    : `/formulario/${seccion.id}`
                }
                aria-disabled={isBlocked || undefined}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                  isCompleted
                    ? "border-success/30 bg-success/5"
                    : isBlocked
                      ? "border-border opacity-50 cursor-not-allowed"
                      : "border-border hover:border-primary/30 hover:bg-accent"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                    isCompleted
                      ? "bg-success/15 text-success"
                      : isBlocked
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary"
                  }`}
                >
                  {isBlocked ? (
                    <Lock size={18} />
                  ) : isCompleted ? (
                    <Check size={18} />
                  ) : (
                    <Icon size={18} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Sección {seccion.id}: {seccion.titulo}
                  </p>
                  {isBlocked && (
                    <p className="text-xs text-muted-foreground">
                      Complete primero la Sección 2
                    </p>
                  )}
                </div>
                {isCompleted && (
                  <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded">
                    Completada
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
