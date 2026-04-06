import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ChevronRight, Download } from "lucide-react";
import type { FormularioProgreso } from "@/lib/types";

export default async function ConcesionariosPage() {
  const supabase = await createClient();

  const { data: concesionarios } = await supabase
    .from("concesionarios")
    .select(
      "id, nombre, zona, estado, formulario_estado, formulario_progreso, updated_at"
    )
    .order("nombre");

  function getProgresoPct(progreso: FormularioProgreso) {
    const total = Object.values(progreso).length;
    const done = Object.values(progreso).filter(Boolean).length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Concesionarios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {concesionarios?.length ?? 0} concesionarios registrados
          </p>
        </div>
        <Link
          href="/admin/exportar"
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
        >
          <Download size={15} />
          Exportar CSV
        </Link>
      </div>

      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                Concesionario
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                Zona / Estado
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Estado
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-40">
                Progreso
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                Última actividad
              </th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {!concesionarios || concesionarios.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  No hay concesionarios registrados.
                </td>
              </tr>
            ) : (
              concesionarios.map((c) => {
                const progreso = (
                  c.formulario_progreso as FormularioProgreso
                ) ?? {
                  seccion1: false,
                  seccion2: false,
                  seccion3: false,
                  seccion4: false,
                  seccion5: false,
                };
                const pct = getProgresoPct(progreso);
                const lastUpdate = new Date(c.updated_at).toLocaleDateString(
                  "es-VE",
                  { day: "2-digit", month: "short", year: "numeric" }
                );

                return (
                  <tr
                    key={c.id}
                    className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-5 py-4 font-medium">{c.nombre}</td>
                    <td className="px-4 py-4 text-muted-foreground hidden md:table-cell">
                      {[c.zona, c.estado].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-4">
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
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct === 100 ? "bg-success" : "bg-primary"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-xs hidden lg:table-cell">
                      {lastUpdate}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/concesionarios/${c.id}`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
