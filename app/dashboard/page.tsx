import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          Bienvenido al Portal ASOTOY
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Estudio de Remuneración — Red de Concesionarios Toyota Venezuela
        </p>
      </div>

      {/* Stats placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Secciones completadas", value: "0 / 5", color: "var(--primary)" },
          { label: "Empleados registrados", value: "—", color: "#10b981" },
          { label: "Estado del formulario", value: "Pendiente", color: "#f59e0b" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-5"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
              {stat.label}
            </p>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Next step */}
      <div
        className="mt-6 rounded-xl p-5 flex items-center justify-between"
        style={{
          background: "rgba(124,107,255,0.08)",
          border: "1px solid rgba(124,107,255,0.2)",
        }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Completa el formulario de remuneración
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            5 secciones · Guarda tu progreso en cualquier momento
          </p>
        </div>
        <a
          href="/formulario"
          className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--primary)" }}
        >
          Ir al formulario →
        </a>
      </div>
    </div>
  );
}
