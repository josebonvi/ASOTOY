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
  GitBranch,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrganigramaEstado } from "@/lib/types";
import { StaggerContainer, StaggerItem } from "@/components/shared/StaggerAnimation";

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
    organigrama: false,
    seccion1: false,
    seccion2: false,
    seccion3: false,
    seccion4: false,
    seccion5: false,
  };

  const orgEstado = (concesionario.organigrama_estado as OrganigramaEstado) ?? "no_iniciado";

  const completedCount = Object.values(progreso).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 6) * 100);

  // Find next incomplete section
  const nextSection = FORMULARIO_SECCIONES.find((s) => !progreso[s.key]);
  const nextHref = nextSection
    ? `/formulario/${nextSection.id}`
    : "/formulario/confirmacion";

  return (
    <div className="max-w-5xl mx-auto w-full">
      {/* Welcome banner */}
      <div className="rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-5 sm:p-8 mb-6 relative overflow-hidden before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.08)_1px,transparent_1px),radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.06)_1px,transparent_1px),radial-gradient(circle_at_40%_80%,rgba(255,255,255,0.05)_1px,transparent_1px)] before:bg-[length:60px_60px,80px_80px,100px_100px] before:opacity-60 before:pointer-events-none after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.15)_1px,transparent_1px),radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.12)_1px,transparent_1px),radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.1)_1px,transparent_1px),radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.12)_1px,transparent_1px),radial-gradient(circle_at_90%_40%,rgba(255,255,255,0.15)_1px,transparent_1px)] after:bg-[length:40px_40px,55px_55px,70px_70px,85px_85px,50px_50px] after:opacity-[0.06] after:pointer-events-none">
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/5 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-8 -right-4 w-24 h-24 rounded-full bg-white/5 animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        <div className="relative">
          <p className="text-primary-foreground/60 text-xs font-medium uppercase tracking-wider mb-2">
            Estudio de Remuneración — Red Toyota Venezuela
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-primary-foreground">
            Bienvenido, {concesionario.nombre}
          </h1>
          <p className="text-primary-foreground/70 mt-2 text-sm max-w-lg">
            Complete el formulario para participar en el primer estudio
            de estructura salarial y talento de la red de concesionarios
            Toyota en Venezuela.
          </p>
          <Link href={nextHref}>
            <Button
              variant="secondary"
              className="mt-5 bg-white text-primary hover:bg-white/90 font-semibold shadow-lg"
            >
              {completedCount === 0
                ? "Comenzar formulario"
                : completedCount === 6
                  ? "Ver confirmación"
                  : "Continuar donde te quedaste"}
              <ArrowRight size={16} className="ml-2 animate-bounce" style={{ animationDuration: '2s' }} />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StaggerItem className="rounded-xl p-5 bg-card border border-border border-t-2 border-t-primary shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            Progreso general
          </p>
          <p className="text-3xl font-bold text-primary mb-2">{progressPercent}%</p>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </StaggerItem>
        <StaggerItem className={`rounded-xl p-5 bg-card border border-border border-t-2 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 ${completedCount === 6 ? 'border-t-success' : completedCount > 0 ? 'border-t-warning' : 'border-t-muted-foreground'}`}>
          <p className="text-xs font-medium text-muted-foreground mb-3">
            Secciones completadas
          </p>
          <p className="text-3xl font-bold text-foreground">
            {completedCount}{" "}
            <span className="text-base text-muted-foreground font-normal">
              / 6
            </span>
          </p>
          <div className="flex gap-1.5 mt-2">
            <div
              className={`h-1.5 flex-1 rounded-full ${
                progreso.organigrama ? "bg-success" : "bg-muted"
              }`}
            />
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  progreso[`seccion${i}` as keyof typeof progreso]
                    ? "bg-success"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </StaggerItem>
        <StaggerItem className={`rounded-xl p-5 bg-card border border-border border-t-2 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 ${concesionario.formulario_estado === 'completado' ? 'border-t-success' : concesionario.formulario_estado === 'en_progreso' ? 'border-t-warning' : 'border-t-muted-foreground'}`}>
          <p className="text-xs font-medium text-muted-foreground mb-3">
            Estado
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                concesionario.formulario_estado === "completado"
                  ? "bg-success"
                  : concesionario.formulario_estado === "en_progreso"
                    ? "bg-warning"
                    : "bg-muted-foreground"
              }`}
            />
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
        </StaggerItem>
      </StaggerContainer>

      {/* Organigrama card (Step 0) */}
      <div className="rounded-xl bg-card border border-primary/20 p-4 sm:p-6 mb-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-lg ${
              orgEstado === "aprobado"
                ? "bg-success/15 text-success"
                : orgEstado === "no_iniciado"
                  ? "bg-destructive/15 text-destructive"
                  : "bg-primary/10 text-primary"
            }`}
          >
            {orgEstado === "aprobado" ? (
              <Check size={18} />
            ) : (
              <GitBranch size={18} />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Organigrama</p>
            {orgEstado === "no_iniciado" && (
              <>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded mt-1">
                  <AlertCircle size={12} />
                  No enviado
                </span>
                <Link href="/organigrama" className="block mt-2">
                  <Button size="sm" variant="default" className="text-xs">
                    Enviar organigrama
                    <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                </Link>
              </>
            )}
            {orgEstado === "pendiente" && (
              <>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded mt-1">
                  <Clock size={12} />
                  Pendiente de revisión
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Nuestro equipo está procesando su organigrama
                </p>
              </>
            )}
            {orgEstado === "en_revision" && (
              <>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded mt-1">
                  <Clock size={12} />
                  En revisión
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Nuestro equipo está procesando su organigrama
                </p>
              </>
            )}
            {orgEstado === "aprobado" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded mt-1">
                <Check size={12} />
                Aprobado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Section list */}
      <div className="rounded-xl bg-card border border-border p-4 sm:p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Secciones del formulario
        </h3>
        <StaggerContainer className="flex flex-col gap-2">
          {FORMULARIO_SECCIONES.map((seccion) => {
            const Icon = iconMap[seccion.icono] || Target;
            const isCompleted = progreso[seccion.key];
            const isBlocked =
              seccion.requiere === "organigrama"
                ? orgEstado !== "aprobado"
                : seccion.requiere && !progreso[seccion.requiere];

            return (
              <StaggerItem key={seccion.id}>
                <Link
                  href={
                    isBlocked
                      ? `/inicio`
                      : `/formulario/${seccion.id}`
                  }
                  aria-disabled={isBlocked || undefined}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-all duration-200 ${
                    isCompleted
                      ? "border-success/30 bg-success/5 hover:shadow-sm"
                      : isBlocked
                        ? "border-border opacity-50 cursor-not-allowed"
                        : "border-border hover:border-primary/20 hover:shadow-sm hover:bg-accent"
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
                        {seccion.requiere === "organigrama"
                          ? "Requiere organigrama aprobado"
                          : "Complete primero la Sección 2"}
                      </p>
                    )}
                  </div>
                  {isCompleted && (
                    <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded">
                      Completada
                    </span>
                  )}
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </div>
  );
}
