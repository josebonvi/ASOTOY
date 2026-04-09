import { createClient } from "@/lib/supabase/server";
import { Building2, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: concesionarios } = await supabase
    .from("concesionarios")
    .select("id, nombre, zona, estado, formulario_estado, formulario_progreso, updated_at")
    .order("updated_at", { ascending: false });

  const total = concesionarios?.length ?? 0;
  const completados =
    concesionarios?.filter((c) => c.formulario_estado === "completado").length ?? 0;
  const enProgreso =
    concesionarios?.filter((c) => c.formulario_estado === "en_progreso").length ?? 0;
  const pendientes =
    concesionarios?.filter((c) => c.formulario_estado === "pendiente").length ?? 0;

  const kpis = [
    {
      label: "Total concesionarios",
      value: total,
      icon: Building2,
      color: "text-foreground",
    },
    {
      label: "Completados",
      value: completados,
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      label: "En progreso",
      value: enProgreso,
      icon: Clock,
      color: "text-warning",
    },
    {
      label: "Pendientes",
      value: pendientes,
      icon: AlertCircle,
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="max-w-6xl">
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
            className="rounded-xl p-5 bg-card border border-border"
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
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Progreso general</h3>
          <span className="text-sm text-muted-foreground">
            {total > 0 ? Math.round((completados / total) * 100) : 0}%
            completado
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{
              width: `${total > 0 ? (completados / total) * 100 : 0}%`,
            }}
          />
        </div>
        <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
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
