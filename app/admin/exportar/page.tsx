"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";

type ExportType = "concesionarios" | "cargos" | "rangos" | "necesidades";

const EXPORTS: { id: ExportType; label: string; desc: string }[] = [
  {
    id: "concesionarios",
    label: "Concesionarios",
    desc: "Datos generales, áreas y progreso del formulario",
  },
  {
    id: "cargos",
    label: "Cargos",
    desc: "Clasificación de cargos por concesionario",
  },
  {
    id: "rangos",
    label: "Rangos salariales",
    desc: "Salarios mínimos, máximos y tipo de pago",
  },
  {
    id: "necesidades",
    label: "Necesidades y brechas",
    desc: "Habilidades escasas y necesidades de capacitación",
  },
];

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

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportarPage() {
  const [loading, setLoading] = useState<ExportType | null>(null);
  const supabase = createClient();

  async function handleExport(type: ExportType) {
    setLoading(type);
    try {
      let rows: Record<string, unknown>[] = [];

      if (type === "concesionarios") {
        const { data } = await supabase
          .from("concesionarios")
          .select("nombre, zona, estado, ciudad, num_empleados, tiene_organigrama, responsable_nombre, responsable_email, formulario_estado, updated_at")
          .order("nombre");
        rows = (data ?? []) as Record<string, unknown>[];
      } else if (type === "cargos") {
        const { data } = await supabase
          .from("cargos")
          .select("concesionario_id, nombre_cargo, area, nivel_toyota, nivel_interno, num_personas, certificado_toyota, es_cargo_rotacion")
          .order("concesionario_id");
        // Join concesionario nombre
        const { data: concs } = await supabase
          .from("concesionarios")
          .select("id, nombre");
        const concMap = Object.fromEntries((concs ?? []).map((c) => [c.id, c.nombre]));
        rows = (data ?? []).map((r) => ({
          concesionario: concMap[r.concesionario_id] ?? r.concesionario_id,
          ...r,
        })) as Record<string, unknown>[];
      } else if (type === "rangos") {
        const { data } = await supabase
          .from("rangos_salariales")
          .select("concesionario_id, cargo_id, moneda, salario_min, salario_max, tipo_pago, tiene_comisiones, tiene_bonos, frecuencia_revision");
        const { data: concs } = await supabase
          .from("concesionarios")
          .select("id, nombre");
        const { data: cargos } = await supabase
          .from("cargos")
          .select("id, nombre_cargo");
        const concMap = Object.fromEntries((concs ?? []).map((c) => [c.id, c.nombre]));
        const cargoMap = Object.fromEntries((cargos ?? []).map((c) => [c.id, c.nombre_cargo]));
        rows = (data ?? []).map((r) => ({
          concesionario: concMap[r.concesionario_id] ?? r.concesionario_id,
          cargo: cargoMap[r.cargo_id] ?? r.cargo_id,
          moneda: r.moneda,
          salario_min: r.salario_min,
          salario_max: r.salario_max,
          tipo_pago: r.tipo_pago,
          tiene_comisiones: r.tiene_comisiones,
          tiene_bonos: r.tiene_bonos,
          frecuencia_revision: r.frecuencia_revision,
        })) as Record<string, unknown>[];
      } else if (type === "necesidades") {
        const { data } = await supabase
          .from("necesidades")
          .select("concesionario_id, cargos_dificiles_cubrir, habilidades_escasas, formacion_necesaria, interes_asotoy_college, comentarios_adicionales");
        const { data: concs } = await supabase
          .from("concesionarios")
          .select("id, nombre");
        const concMap = Object.fromEntries((concs ?? []).map((c) => [c.id, c.nombre]));
        rows = (data ?? []).map((r) => ({
          concesionario: concMap[r.concesionario_id] ?? r.concesionario_id,
          ...r,
        })) as Record<string, unknown>[];
      }

      const csv = toCsv(rows);
      if (!csv) {
        alert("No hay data para exportar aún.");
        return;
      }
      const date = new Date().toISOString().split("T")[0];
      downloadCsv(csv, `asotoy_${type}_${date}.csv`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Exportar data</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Descarga la data recolectada en formato CSV
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EXPORTS.map((exp) => (
          <div
            key={exp.id}
            className="rounded-xl bg-card border border-border p-5 flex flex-col gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold">{exp.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {exp.desc}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport(exp.id)}
              disabled={loading === exp.id}
              className="w-full"
            >
              {loading === exp.id ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : (
                <Download size={14} className="mr-2" />
              )}
              {loading === exp.id ? "Descargando..." : "Descargar CSV"}
            </Button>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-6">
        Los archivos se generan en tiempo real con la data actual. Formato UTF-8 compatible con Excel.
      </p>
    </div>
  );
}
