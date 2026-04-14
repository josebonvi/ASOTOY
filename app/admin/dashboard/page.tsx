import { createClient } from "@/lib/supabase/server";
import { Building2, CheckCircle2, Clock, AlertCircle, Network, FileCheck } from "lucide-react";
import Link from "next/link";

function getRelativeTime(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `hace ${minutes} min`;
  if (hours < 24) return `hace ${hours} horas`;
  return `hace ${days} días`;
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ data: concesionarios }, { data: organigramas }] = await Promise.all([
    supabase
      .from("concesionarios")
      .select("id, nombre, zona, estado, formulario_estado, formulario_progreso, organigrama_estado, updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .from("organigramas")
      .select("id, concesionario_id, tipo, estado, created_at, concesionario:concesionarios(nombre)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const total = concesionarios?.length ?? 0;
  const completados =
    concesionarios?.filter((c) => c.formulario_estado === "completado").length ?? 0;
  const enProgreso =
    concesionarios?.filter((c) => c.formulario_estado === "en_progreso").length ?? 0;
  const pendientes =
    concesionarios?.filter((c) => c.formulario_estado === "pendiente").length ?? 0;

  // Organigrama stats
  const orgPendientes = organigramas?.filter((o) => o.estado === "pendiente").length ?? 0;
  const orgAprobados = organigramas?.filter((o) => o.estado === "aprobado").length ?? 0;

  const kpis = [
    {
      label: "Total concesionarios",
      value: total,
      icon: Building2,
      color: "text-foreground",
      borderColor: "border-t-primary",
    },
    {
      label: "Completados",
      value: completados,
      icon: CheckCircle2,
      color: "text-success",
      borderColor: "border-t-success",
    },
    {
      label: "En progreso",
      value: enProgreso,
      icon: Clock,
      color: "text-warning",
      borderColor: "border-t-warning",
    },
    {
      label: "Organigramas pendientes",
      value: orgPendientes,
      icon: Network,
      color: orgPendientes > 0 ? "text-warning" : "text-muted-foreground",
      borderColor: orgPendientes > 0 ? "border-t-warning" : "border-t-muted-foreground",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Panel de control — Estudio de Remuneración Red Toyota Venezuela
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-xl p-5 bg-card border border-border border-t-2 ${kpi.borderColor} shadow-sm hover:scale-[1.02] transition-all duration-200`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">
                {kpi.label}
              </p>
              <kpi.icon size={16} className="text-muted-foreground" />
            </div>
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="rounded-xl p-6 bg-card border border-border mb-8">
        <h3 className="text-sm font-semibold mb-4">Progreso general</h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Porcentaje grande a la izquierda */}
          <div className="flex-shrink-0 text-center sm:text-left">
            <p className="text-4xl font-bold text-primary">
              {total > 0 ? Math.round((completados / total) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">completado</p>
          </div>
          {/* Barra de progreso y leyenda a la derecha */}
          <div className="flex-1">
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{
                  width: `${total > 0 ? (completados / total) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-6 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success" />
                {completados} completados
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-warning" />
                {enProgreso} en progreso
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                {pendientes} pendientes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Organigramas pendientes */}
      {orgPendientes > 0 && (
        <div className="rounded-xl p-6 bg-card border border-warning/30 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Network size={16} className="text-warning" />
              Organigramas por revisar
            </h3>
            <Link
              href="/admin/organigramas"
              className="text-xs text-primary hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {organigramas
              ?.filter((o) => o.estado === "pendiente")
              .slice(0, 5)
              .map((o) => {
                const rawConc = o.concesionario;
                const conc = (Array.isArray(rawConc) ? rawConc[0] : rawConc) as { nombre: string } | null;
                return (
                  <Link
                    key={o.id}
                    href={`/admin/organigramas/${o.id}`}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-accent/50 -mx-2 px-2 rounded transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {conc?.nombre ?? "Concesionario"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {o.tipo === "upload" ? "Archivo subido" : "Builder"} —{" "}
                        {new Date(o.created_at).toLocaleDateString("es-VE")}
                      </p>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-warning/10 text-warning">
                      Pendiente
                    </span>
                  </Link>
                );
              })}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="rounded-xl p-6 bg-card border border-border">
        <h3 className="text-sm font-semibold mb-4">Actividad reciente</h3>
        {concesionarios && concesionarios.length > 0 ? (
          <div className="flex flex-col gap-3">
            {concesionarios.slice(0, 5).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{c.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.zona} — {c.estado}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      c.formulario_estado === "completado"
                        ? "bg-success/10 text-success"
                        : c.formulario_estado === "en_progreso"
                          ? "bg-warning/10 text-warning"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.formulario_estado === "completado"
                      ? "Completado"
                      : c.formulario_estado === "en_progreso"
                        ? "En progreso"
                        : "Pendiente"}
                  </span>
                  {c.updated_at && (
                    <span className="text-[10px] text-muted-foreground">
                      {getRelativeTime(c.updated_at)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay concesionarios registrados aún.
          </p>
        )}
      </div>
    </div>
  );
}
