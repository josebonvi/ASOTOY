"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Download,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
} from "lucide-react";
import type { FormularioEstado, FormularioProgreso } from "@/lib/types";

type FilterEstado = "todos" | FormularioEstado;

interface ConcesionarioRow {
  id: string;
  nombre: string;
  zona: string | null;
  estado: string | null;
  formulario_estado: FormularioEstado;
  formulario_progreso: FormularioProgreso;
  updated_at: string;
}

interface Props {
  concesionarios: ConcesionarioRow[];
}

const ESTADO_LABELS: Record<FormularioEstado, string> = {
  completado: "Completado",
  en_progreso: "En progreso",
  pendiente: "Pendiente",
};

const FILTERS: { id: FilterEstado; label: string; icon: typeof Building2 }[] = [
  { id: "todos", label: "Todos", icon: Building2 },
  { id: "completado", label: "Completados", icon: CheckCircle2 },
  { id: "en_progreso", label: "En progreso", icon: Clock },
  { id: "pendiente", label: "Sin iniciar", icon: AlertCircle },
];

function getProgresoPct(progreso: FormularioProgreso): number {
  const vals = Object.values(progreso);
  const total = vals.length;
  const done = vals.filter(Boolean).length;
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

export default function ConcesionariosTable({ concesionarios }: Props) {
  const [filtro, setFiltro] = useState<FilterEstado>("todos");
  const [busqueda, setBusqueda] = useState("");

  const counts = useMemo(() => {
    const c = { todos: 0, completado: 0, en_progreso: 0, pendiente: 0 };
    for (const conc of concesionarios) {
      c.todos++;
      c[conc.formulario_estado]++;
    }
    return c;
  }, [concesionarios]);

  const completados = counts.completado;
  const total = counts.todos;
  const progressPct = total > 0 ? Math.round((completados / total) * 100) : 0;

  const filtered = useMemo(() => {
    let list = concesionarios;
    if (filtro !== "todos") {
      list = list.filter((c) => c.formulario_estado === filtro);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      list = list.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          (c.zona && c.zona.toLowerCase().includes(q)) ||
          (c.estado && c.estado.toLowerCase().includes(q))
      );
    }
    return list;
  }, [concesionarios, filtro, busqueda]);

  function handleExportCsv() {
    const rows = filtered.map((c) => {
      const pct = getProgresoPct(
        c.formulario_progreso ?? {
          seccion1: false,
          seccion2: false,
          seccion3: false,
          seccion4: false,
          seccion5: false,
        }
      );
      return {
        nombre: c.nombre,
        zona: c.zona ?? "",
        estado_geo: c.estado ?? "",
        formulario_estado: ESTADO_LABELS[c.formulario_estado],
        progreso_pct: pct,
        ultima_actividad: new Date(c.updated_at).toLocaleDateString("es-VE"),
      };
    });
    const csv = toCsv(rows as unknown as Record<string, unknown>[]);
    if (!csv) return;
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asotoy_concesionarios_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Barra de progreso global */}
      <div className="rounded-xl p-5 bg-card border border-border mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Progreso general</h3>
          <span className="text-sm text-muted-foreground">
            {completados} de {total} completados ({progressPct}%)
          </span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex gap-5 mt-2.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" />
            {counts.completado} completados
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning" />
            {counts.en_progreso} en progreso
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            {counts.pendiente} pendientes
          </span>
        </div>
      </div>

      {/* Filtros + Búsqueda + Exportar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => {
            const isActive = filtro === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-accent"
                }`}
              >
                <f.icon size={13} />
                {f.label}
                <span
                  className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-primary-foreground/20"
                      : "bg-muted"
                  }`}
                >
                  {counts[f.id]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 sm:ml-auto w-full sm:w-auto">
          <div className="relative flex-1 sm:w-52 sm:flex-none">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Buscar concesionario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-border bg-card placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors shrink-0"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Tabla */}
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
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  {busqueda
                    ? "No se encontraron concesionarios."
                    : "No hay concesionarios en esta categoría."}
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const progreso = c.formulario_progreso ?? {
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
                        {ESTADO_LABELS[c.formulario_estado]}
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

      <p className="text-xs text-muted-foreground mt-3">
        Mostrando {filtered.length} de {total} concesionarios
      </p>
    </div>
  );
}
