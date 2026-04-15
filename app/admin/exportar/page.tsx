"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getNivelToyotaLabel, EDUCACION_MINIMA } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Download,
  Loader2,
  Database,
  MapPin,
  GraduationCap,
  LineChart,
  Building2,
  Users,
  DollarSign,
  UserCog,
  Target,
  Map as MapIcon,
  Wrench,
  Sparkles,
  BookOpen,
  HeartHandshake,
  School,
  FileBarChart,
  Award,
  LucideIcon,
} from "lucide-react";

// ---------- Types ----------

type ExportId =
  // Cruda
  | "concesionarios"
  | "cargos"
  | "rangos"
  | "perfiles"
  | "necesidades"
  // Zonas
  | "salarios_zona"
  | "necesidades_zona"
  | "talento_zona"
  // College
  | "capacitacion_prioridades"
  | "interes_college"
  | "brechas_educativas"
  // Estratégico
  | "ejecutivo_consolidado"
  | "madurez_red";

type Category = {
  id: "cruda" | "zonas" | "college" | "estrategico";
  label: string;
  desc: string;
  icon: LucideIcon;
  color: string;
};

type ExportDef = {
  id: ExportId;
  label: string;
  desc: string;
  audiencia: string;
  valor: string;
  category: Category["id"];
  icon: LucideIcon;
  badge?: "nuevo" | "benchmark" | "estrategico";
};

const CATEGORIES: Category[] = [
  {
    id: "cruda",
    label: "Data cruda",
    desc: "Exportaciones directas de cada tabla para análisis propio",
    icon: Database,
    color: "text-muted-foreground",
  },
  {
    id: "zonas",
    label: "Benchmarks por zona",
    desc: "Promedios, necesidades y composición de talento agrupados por zona geográfica",
    icon: MapPin,
    color: "text-blue-500",
  },
  {
    id: "college",
    label: "ASOTOY College",
    desc: "Insumos para diseñar los programas de formación",
    icon: GraduationCap,
    color: "text-purple-500",
  },
  {
    id: "estrategico",
    label: "Estratégico",
    desc: "Vista consolidada para Toyota y la Asociación",
    icon: LineChart,
    color: "text-primary",
  },
];

const EXPORTS: ExportDef[] = [
  // ---- Data cruda ----
  {
    id: "concesionarios",
    label: "Concesionarios",
    desc: "Datos generales, áreas y progreso del formulario.",
    audiencia: "Equipo ASOTOY",
    valor: "Padrón maestro con ubicación, tamaño y estatus de cada concesionario.",
    category: "cruda",
    icon: Building2,
  },
  {
    id: "cargos",
    label: "Cargos",
    desc: "Clasificación de cargos por concesionario con nivel Toyota.",
    audiencia: "Equipo ASOTOY / Toyota",
    valor: "Universo completo de cargos, niveles y certificaciones declaradas.",
    category: "cruda",
    icon: Users,
  },
  {
    id: "rangos",
    label: "Rangos salariales",
    desc: "Salarios mínimos, máximos, moneda y esquema de pago.",
    audiencia: "Equipo ASOTOY / Toyota",
    valor: "Base para calcular cualquier cruce salarial.",
    category: "cruda",
    icon: DollarSign,
  },
  {
    id: "perfiles",
    label: "Perfiles de talento",
    desc: "Educación, experiencia y habilidades exigidas por cargo.",
    audiencia: "ASOTOY College",
    valor: "Define el perfil ideal vs. lo que hoy se consigue en el mercado.",
    category: "cruda",
    icon: UserCog,
  },
  {
    id: "necesidades",
    label: "Necesidades y brechas",
    desc: "Habilidades escasas y necesidades de capacitación declaradas.",
    audiencia: "ASOTOY College",
    valor: "Insumo directo para priorizar los programas de formación.",
    category: "cruda",
    icon: Target,
  },
  // ---- Zonas ----
  {
    id: "salarios_zona",
    label: "Salarios promedio por zona y cargo",
    desc: "Benchmark salarial cruzando zona geográfica, cargo y nivel Toyota.",
    audiencia: "Concesionarios / Toyota",
    valor:
      "Permite a un concesionario saber si paga por encima o por debajo del promedio de su zona para un mismo cargo.",
    category: "zonas",
    icon: MapIcon,
    badge: "benchmark",
  },
  {
    id: "necesidades_zona",
    label: "Necesidades laborales por zona",
    desc: "Cargos difíciles, habilidades escasas y formación requerida agrupadas por zona.",
    audiencia: "ASOTOY / ASOTOY College",
    valor:
      "Muestra qué habilidades escasean en Oriente vs. Occidente vs. Centro para enfocar reclutamiento y capacitación regional.",
    category: "zonas",
    icon: Wrench,
    badge: "nuevo",
  },
  {
    id: "talento_zona",
    label: "Distribución de talento por zona",
    desc: "# personas, composición G1–G4 y % de certificación Toyota por zona.",
    audiencia: "Toyota",
    valor: "Mapa de madurez técnica de la red a nivel regional.",
    category: "zonas",
    icon: Sparkles,
    badge: "benchmark",
  },
  // ---- College ----
  {
    id: "capacitacion_prioridades",
    label: "Prioridades de capacitación",
    desc: "Ranking nacional de habilidades escasas y formación requerida, ponderado por # concesionarios que la mencionan.",
    audiencia: "ASOTOY College",
    valor:
      "Primer filtro para decidir qué programas lanzar en la Fase 1 del College.",
    category: "college",
    icon: BookOpen,
    badge: "nuevo",
  },
  {
    id: "interes_college",
    label: "Interés en ASOTOY College",
    desc: "Concesionarios segmentados por nivel de interés en los programas.",
    audiencia: "ASOTOY College",
    valor:
      "Lista priorizada para las primeras reuniones comerciales y pilotos del College.",
    category: "college",
    icon: HeartHandshake,
  },
  {
    id: "brechas_educativas",
    label: "Brechas educativas por cargo",
    desc: "Educación mínima requerida vs. experiencia exigida por cargo y nivel Toyota.",
    audiencia: "ASOTOY College",
    valor:
      "Matriz que el College usará para diseñar rutas formativas por cargo (G1 → G4).",
    category: "college",
    icon: School,
    badge: "nuevo",
  },
  // ---- Estratégico ----
  {
    id: "ejecutivo_consolidado",
    label: "Reporte ejecutivo consolidado",
    desc: "One-pager con los KPIs nacionales del estudio en una sola hoja.",
    audiencia: "Toyota / Junta ASOTOY",
    valor:
      "Resumen para presentación ejecutiva: # concesionarios, # personas, # cargos, % certificación, top habilidades escasas, interés College.",
    category: "estrategico",
    icon: FileBarChart,
    badge: "estrategico",
  },
  {
    id: "madurez_red",
    label: "Madurez técnica de la red",
    desc: "% de técnicos G3+G4 vs. G1+G2 por concesionario, con ranking.",
    audiencia: "Toyota",
    valor:
      "Identifica concesionarios con músculo técnico alto (candidatos a centros de excelencia) y los que requieren upskilling.",
    category: "estrategico",
    icon: Award,
    badge: "estrategico",
  },
];

// ---------- CSV helpers ----------

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

// Tokeniza un texto libre en "frases" separadas por coma, punto y coma o salto de línea.
// Usado para rankear habilidades/necesidades escritas como texto libre.
function tokenizeFreeText(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/[,;\n]/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 2);
}

function round(n: number, decimals = 0): number {
  const m = Math.pow(10, decimals);
  return Math.round(n * m) / m;
}

// ---------- Component ----------

export default function ExportarPage() {
  const [loading, setLoading] = useState<ExportId | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category["id"]>("cruda");
  const supabase = createClient();

  async function handleExport(type: ExportId) {
    setLoading(type);
    try {
      let rows: Record<string, unknown>[] = [];
      let filename = `asotoy_${type}`;

      // --- data cruda ---
      if (type === "concesionarios") {
        const { data } = await supabase
          .from("concesionarios")
          .select(
            "nombre, zona, estado, ciudad, num_empleados, tiene_organigrama, responsable_nombre, responsable_email, formulario_estado, updated_at"
          )
          .order("nombre");
        rows = (data ?? []) as Record<string, unknown>[];
      } else if (type === "cargos") {
        rows = await buildCargosRaw(supabase);
      } else if (type === "rangos") {
        rows = await buildRangosRaw(supabase);
      } else if (type === "perfiles") {
        rows = await buildPerfilesRaw(supabase);
      } else if (type === "necesidades") {
        rows = await buildNecesidadesRaw(supabase);
      }
      // --- zonas ---
      else if (type === "salarios_zona") {
        rows = await buildSalariosZona(supabase);
      } else if (type === "necesidades_zona") {
        rows = await buildNecesidadesZona(supabase);
      } else if (type === "talento_zona") {
        rows = await buildTalentoZona(supabase);
      }
      // --- college ---
      else if (type === "capacitacion_prioridades") {
        rows = await buildCapacitacionPrioridades(supabase);
      } else if (type === "interes_college") {
        rows = await buildInteresCollege(supabase);
      } else if (type === "brechas_educativas") {
        rows = await buildBrechasEducativas(supabase);
      }
      // --- estratégico ---
      else if (type === "ejecutivo_consolidado") {
        rows = await buildEjecutivoConsolidado(supabase);
      } else if (type === "madurez_red") {
        rows = await buildMadurezRed(supabase);
      }

      const csv = toCsv(rows);
      if (!csv) {
        alert("No hay data suficiente para generar este reporte todavía.");
        return;
      }
      const date = new Date().toISOString().split("T")[0];
      downloadCsv(csv, `${filename}_${date}.csv`);
    } catch (err) {
      console.error(err);
      alert("Hubo un error generando el reporte. Revisa la consola.");
    } finally {
      setLoading(null);
    }
  }

  const visibleExports = EXPORTS.filter((e) => e.category === activeCategory);
  const activeCat = CATEGORIES.find((c) => c.id === activeCategory)!;

  return (
    <div className="max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Exportar data</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Reportes en CSV listos para Toyota, ASOTOY College y los concesionarios. La
          data se genera en tiempo real.
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-4 border-b border-border pb-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = cat.id === activeCategory;
          const count = EXPORTS.filter((e) => e.category === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors border ${
                isActive
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} />
              <span className="font-medium">{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-primary/20" : "bg-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category description */}
      <div className="mb-5">
        <p className="text-xs text-muted-foreground">
          <span className={`font-medium ${activeCat.color}`}>
            {activeCat.label}:
          </span>{" "}
          {activeCat.desc}
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleExports.map((exp) => {
          const Icon = exp.icon;
          return (
            <div
              key={exp.id}
              className="rounded-xl bg-card border border-border p-5 flex flex-col gap-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{exp.label}</p>
                    {exp.badge === "nuevo" && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                        Nuevo
                      </span>
                    )}
                    {exp.badge === "benchmark" && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        Benchmark
                      </span>
                    )}
                    {exp.badge === "estrategico" && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                        Estratégico
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {exp.desc}
                  </p>
                </div>
              </div>

              <div className="text-[11px] space-y-1.5 border-l-2 border-border pl-3">
                <p>
                  <span className="text-muted-foreground">Audiencia:</span>{" "}
                  <span className="font-medium">{exp.audiencia}</span>
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {exp.valor}
                </p>
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
                {loading === exp.id ? "Generando..." : "Descargar CSV"}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-6">
        Formato UTF-8 compatible con Excel. Los reportes agregados se recalculan
        con la data actual de los concesionarios completados.
      </p>
    </div>
  );
}

// ===========================================================================
// REPORT BUILDERS
// ===========================================================================

type SB = ReturnType<typeof createClient>;

async function loadConcesionariosMap(supabase: SB) {
  const { data } = await supabase
    .from("concesionarios")
    .select("id, nombre, zona, estado, ciudad");
  const map = new Map<string, { nombre: string; zona: string | null; estado: string | null; ciudad: string | null }>();
  (data ?? []).forEach((c) =>
    map.set(c.id as string, {
      nombre: c.nombre as string,
      zona: c.zona as string | null,
      estado: c.estado as string | null,
      ciudad: c.ciudad as string | null,
    })
  );
  return map;
}

async function loadCargosMap(supabase: SB) {
  const { data } = await supabase
    .from("cargos")
    .select("id, nombre_cargo, nombre_cargo_dealer, nivel_toyota, num_personas, certificado_toyota, concesionario_id, area");
  return data ?? [];
}

// ---- Cruda ----

async function buildCargosRaw(supabase: SB) {
  const { data } = await supabase
    .from("cargos")
    .select(
      "concesionario_id, nombre_cargo, nombre_cargo_dealer, area, nivel_toyota, nivel_interno, num_personas, certificado_toyota, es_cargo_rotacion, motivo_rotacion"
    )
    .order("concesionario_id");
  const concMap = await loadConcesionariosMap(supabase);
  return (data ?? []).map((r) => ({
    concesionario: concMap.get(r.concesionario_id as string)?.nombre ?? r.concesionario_id,
    zona: concMap.get(r.concesionario_id as string)?.zona ?? "",
    estado: concMap.get(r.concesionario_id as string)?.estado ?? "",
    nombre_cargo: r.nombre_cargo,
    nombre_cargo_dealer: r.nombre_cargo_dealer ?? "",
    area: r.area ?? "",
    nivel_toyota: getNivelToyotaLabel(r.nivel_toyota as string),
    nivel_interno: r.nivel_interno ?? "",
    num_personas: r.num_personas ?? 0,
    certificado_toyota: r.certificado_toyota ? "Sí" : "No",
    es_cargo_rotacion: r.es_cargo_rotacion ? "Sí" : "No",
    motivo_rotacion: r.motivo_rotacion ?? "",
  })) as Record<string, unknown>[];
}

async function buildRangosRaw(supabase: SB) {
  const { data } = await supabase
    .from("rangos_salariales")
    .select(
      "concesionario_id, cargo_id, moneda, salario_min, salario_max, tipo_pago, tiene_comisiones, descripcion_comisiones, tiene_bonos, descripcion_bonos, frecuencia_revision"
    );
  const concMap = await loadConcesionariosMap(supabase);
  const cargos = await loadCargosMap(supabase);
  const cargoMap = new Map<string, { nombre_cargo: string; nivel_toyota: string | null }>();
  cargos.forEach((c) =>
    cargoMap.set(c.id as string, {
      nombre_cargo: c.nombre_cargo as string,
      nivel_toyota: c.nivel_toyota as string | null,
    })
  );
  return (data ?? []).map((r) => ({
    concesionario: concMap.get(r.concesionario_id as string)?.nombre ?? r.concesionario_id,
    zona: concMap.get(r.concesionario_id as string)?.zona ?? "",
    estado: concMap.get(r.concesionario_id as string)?.estado ?? "",
    cargo: cargoMap.get(r.cargo_id as string)?.nombre_cargo ?? r.cargo_id,
    nivel_toyota: getNivelToyotaLabel(cargoMap.get(r.cargo_id as string)?.nivel_toyota ?? null),
    moneda: r.moneda,
    salario_min: r.salario_min,
    salario_max: r.salario_max,
    tipo_pago: r.tipo_pago,
    tiene_comisiones: r.tiene_comisiones ? "Sí" : "No",
    descripcion_comisiones: r.descripcion_comisiones ?? "",
    tiene_bonos: r.tiene_bonos ? "Sí" : "No",
    descripcion_bonos: r.descripcion_bonos ?? "",
    frecuencia_revision: r.frecuencia_revision ?? "",
  })) as Record<string, unknown>[];
}

async function buildPerfilesRaw(supabase: SB) {
  // FIX: usar los campos reales de la tabla perfiles_talento
  const { data } = await supabase
    .from("perfiles_talento")
    .select(
      "concesionario_id, cargo_id, educacion_minima, certificacion_toyota_suficiente, formacion_adicional, experiencia_minima_anios, habilidades_clave, habilidades_faltantes"
    );
  const concMap = await loadConcesionariosMap(supabase);
  const cargos = await loadCargosMap(supabase);
  const cargoMap = new Map<string, { nombre_cargo: string; nivel_toyota: string | null }>();
  cargos.forEach((c) =>
    cargoMap.set(c.id as string, {
      nombre_cargo: c.nombre_cargo as string,
      nivel_toyota: c.nivel_toyota as string | null,
    })
  );
  return (data ?? []).map((r) => ({
    concesionario: concMap.get(r.concesionario_id as string)?.nombre ?? r.concesionario_id,
    zona: concMap.get(r.concesionario_id as string)?.zona ?? "",
    estado: concMap.get(r.concesionario_id as string)?.estado ?? "",
    cargo: cargoMap.get(r.cargo_id as string)?.nombre_cargo ?? r.cargo_id,
    nivel_toyota: getNivelToyotaLabel(cargoMap.get(r.cargo_id as string)?.nivel_toyota ?? null),
    educacion_minima: r.educacion_minima ?? "",
    certificacion_toyota_suficiente: r.certificacion_toyota_suficiente ? "Sí" : "No",
    formacion_adicional: r.formacion_adicional ?? "",
    experiencia_minima_anios: r.experiencia_minima_anios ?? 0,
    habilidades_clave: r.habilidades_clave ?? "",
    habilidades_faltantes: r.habilidades_faltantes ?? "",
  })) as Record<string, unknown>[];
}

async function buildNecesidadesRaw(supabase: SB) {
  const { data } = await supabase
    .from("necesidades")
    .select(
      "concesionario_id, cargos_dificiles_cubrir, habilidades_escasas, formacion_necesaria, interes_asotoy_college, comentarios_adicionales"
    );
  const concMap = await loadConcesionariosMap(supabase);
  return (data ?? []).map((r) => ({
    concesionario: concMap.get(r.concesionario_id as string)?.nombre ?? r.concesionario_id,
    zona: concMap.get(r.concesionario_id as string)?.zona ?? "",
    estado: concMap.get(r.concesionario_id as string)?.estado ?? "",
    cargos_dificiles_cubrir: r.cargos_dificiles_cubrir ?? "",
    habilidades_escasas: r.habilidades_escasas ?? "",
    formacion_necesaria: r.formacion_necesaria ?? "",
    interes_asotoy_college: r.interes_asotoy_college ?? "",
    comentarios_adicionales: r.comentarios_adicionales ?? "",
  })) as Record<string, unknown>[];
}

// ---- Zonas ----

async function buildSalariosZona(supabase: SB) {
  const { data: rangos } = await supabase
    .from("rangos_salariales")
    .select("concesionario_id, cargo_id, moneda, salario_min, salario_max");
  const concMap = await loadConcesionariosMap(supabase);
  const cargos = await loadCargosMap(supabase);
  const cargoMap = new Map<string, { nombre_cargo: string; nivel_toyota: string | null }>();
  cargos.forEach((c) =>
    cargoMap.set(c.id as string, {
      nombre_cargo: c.nombre_cargo as string,
      nivel_toyota: c.nivel_toyota as string | null,
    })
  );

  // Agregar por (zona, cargo_estandar, nivel, moneda)
  type Bucket = {
    zona: string;
    cargo: string;
    nivel: string;
    moneda: string;
    min_sum: number;
    max_sum: number;
    count: number;
    concs: Set<string>;
  };
  const buckets = new Map<string, Bucket>();
  (rangos ?? []).forEach((r) => {
    const conc = concMap.get(r.concesionario_id as string);
    const cargo = cargoMap.get(r.cargo_id as string);
    if (!conc || !cargo) return;
    const zona = conc.zona ?? "Sin zona";
    const nombre = cargo.nombre_cargo ?? "—";
    const nivel = getNivelToyotaLabel(cargo.nivel_toyota);
    const moneda = (r.moneda as string) ?? "—";
    const key = `${zona}||${nombre}||${nivel}||${moneda}`;
    const min = Number(r.salario_min ?? 0);
    const max = Number(r.salario_max ?? 0);
    if (!buckets.has(key)) {
      buckets.set(key, {
        zona,
        cargo: nombre,
        nivel,
        moneda,
        min_sum: 0,
        max_sum: 0,
        count: 0,
        concs: new Set(),
      });
    }
    const b = buckets.get(key)!;
    b.min_sum += min;
    b.max_sum += max;
    b.count += 1;
    b.concs.add(r.concesionario_id as string);
  });

  return Array.from(buckets.values())
    .sort(
      (a, b) =>
        a.zona.localeCompare(b.zona) ||
        a.cargo.localeCompare(b.cargo) ||
        a.moneda.localeCompare(b.moneda)
    )
    .map((b) => ({
      zona: b.zona,
      cargo: b.cargo,
      nivel_toyota: b.nivel,
      moneda: b.moneda,
      salario_min_promedio: round(b.min_sum / b.count),
      salario_max_promedio: round(b.max_sum / b.count),
      salario_medio_promedio: round((b.min_sum + b.max_sum) / (2 * b.count)),
      registros: b.count,
      concesionarios_en_benchmark: b.concs.size,
    })) as Record<string, unknown>[];
}

async function buildNecesidadesZona(supabase: SB) {
  const { data: nec } = await supabase
    .from("necesidades")
    .select(
      "concesionario_id, cargos_dificiles_cubrir, habilidades_escasas, formacion_necesaria"
    );
  const concMap = await loadConcesionariosMap(supabase);

  type Z = {
    zona: string;
    concesionarios: Set<string>;
    cargosDificiles: Map<string, number>;
    habilidadesEscasas: Map<string, number>;
    formacion: Map<string, number>;
  };
  const byZona = new Map<string, Z>();

  const push = (map: Map<string, number>, text: string | null | undefined) => {
    tokenizeFreeText(text).forEach((tok) => {
      map.set(tok, (map.get(tok) ?? 0) + 1);
    });
  };

  (nec ?? []).forEach((n) => {
    const conc = concMap.get(n.concesionario_id as string);
    const zona = conc?.zona ?? "Sin zona";
    if (!byZona.has(zona)) {
      byZona.set(zona, {
        zona,
        concesionarios: new Set(),
        cargosDificiles: new Map(),
        habilidadesEscasas: new Map(),
        formacion: new Map(),
      });
    }
    const z = byZona.get(zona)!;
    z.concesionarios.add(n.concesionario_id as string);
    push(z.cargosDificiles, n.cargos_dificiles_cubrir as string);
    push(z.habilidadesEscasas, n.habilidades_escasas as string);
    push(z.formacion, n.formacion_necesaria as string);
  });

  const top = (m: Map<string, number>, n: number) =>
    Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k, v]) => `${k} (${v})`)
      .join(" | ");

  return Array.from(byZona.values())
    .sort((a, b) => a.zona.localeCompare(b.zona))
    .map((z) => ({
      zona: z.zona,
      concesionarios_analizados: z.concesionarios.size,
      top_cargos_dificiles: top(z.cargosDificiles, 5),
      top_habilidades_escasas: top(z.habilidadesEscasas, 5),
      top_formacion_necesaria: top(z.formacion, 5),
    })) as Record<string, unknown>[];
}

async function buildTalentoZona(supabase: SB) {
  const cargos = await loadCargosMap(supabase);
  const concMap = await loadConcesionariosMap(supabase);

  type Z = {
    zona: string;
    concesionarios: Set<string>;
    totalPersonas: number;
    g1: number;
    g2: number;
    g3: number;
    g4: number;
    ayudante: number;
    noAplica: number;
    certificadas: number;
  };
  const byZona = new Map<string, Z>();

  cargos.forEach((c) => {
    const conc = concMap.get(c.concesionario_id as string);
    const zona = conc?.zona ?? "Sin zona";
    if (!byZona.has(zona)) {
      byZona.set(zona, {
        zona,
        concesionarios: new Set(),
        totalPersonas: 0,
        g1: 0,
        g2: 0,
        g3: 0,
        g4: 0,
        ayudante: 0,
        noAplica: 0,
        certificadas: 0,
      });
    }
    const z = byZona.get(zona)!;
    z.concesionarios.add(c.concesionario_id as string);
    const n = Number(c.num_personas ?? 0);
    z.totalPersonas += n;
    if (c.certificado_toyota) z.certificadas += n;
    switch (c.nivel_toyota) {
      case "tecnico_g1":
        z.g1 += n;
        break;
      case "tecnico_g2":
        z.g2 += n;
        break;
      case "tecnico_g3":
        z.g3 += n;
        break;
      case "tecnico_g4":
        z.g4 += n;
        break;
      case "ayudante":
        z.ayudante += n;
        break;
      default:
        z.noAplica += n;
    }
  });

  return Array.from(byZona.values())
    .sort((a, b) => a.zona.localeCompare(b.zona))
    .map((z) => {
      const tecnicos = z.g1 + z.g2 + z.g3 + z.g4 + z.ayudante;
      const maduros = z.g3 + z.g4;
      return {
        zona: z.zona,
        concesionarios: z.concesionarios.size,
        total_personas: z.totalPersonas,
        tecnicos_total: tecnicos,
        ayudantes: z.ayudante,
        g1: z.g1,
        g2: z.g2,
        g3: z.g3,
        g4: z.g4,
        no_aplica: z.noAplica,
        pct_g3_g4: tecnicos > 0 ? round((maduros / tecnicos) * 100, 1) : 0,
        pct_certificacion_toyota:
          z.totalPersonas > 0
            ? round((z.certificadas / z.totalPersonas) * 100, 1)
            : 0,
      };
    }) as Record<string, unknown>[];
}

// ---- College ----

async function buildCapacitacionPrioridades(supabase: SB) {
  const { data: nec } = await supabase
    .from("necesidades")
    .select("concesionario_id, habilidades_escasas, formacion_necesaria");
  const { data: perf } = await supabase
    .from("perfiles_talento")
    .select("concesionario_id, habilidades_faltantes, formacion_adicional");
  const concMap = await loadConcesionariosMap(supabase);

  type Item = {
    tema: string;
    fuente: "habilidades_escasas" | "formacion_necesaria" | "habilidades_faltantes" | "formacion_adicional";
    menciones: number;
    concesionarios: Set<string>;
    zonas: Set<string>;
  };
  const index = new Map<string, Item>();

  const register = (
    text: string | null | undefined,
    fuente: Item["fuente"],
    concId: string
  ) => {
    const zona = concMap.get(concId)?.zona ?? "Sin zona";
    tokenizeFreeText(text).forEach((tok) => {
      const key = `${fuente}||${tok}`;
      if (!index.has(key)) {
        index.set(key, {
          tema: tok,
          fuente,
          menciones: 0,
          concesionarios: new Set(),
          zonas: new Set(),
        });
      }
      const it = index.get(key)!;
      it.menciones += 1;
      it.concesionarios.add(concId);
      it.zonas.add(zona);
    });
  };

  (nec ?? []).forEach((n) => {
    register(n.habilidades_escasas as string, "habilidades_escasas", n.concesionario_id as string);
    register(n.formacion_necesaria as string, "formacion_necesaria", n.concesionario_id as string);
  });
  (perf ?? []).forEach((p) => {
    register(p.habilidades_faltantes as string, "habilidades_faltantes", p.concesionario_id as string);
    register(p.formacion_adicional as string, "formacion_adicional", p.concesionario_id as string);
  });

  return Array.from(index.values())
    .sort((a, b) => b.concesionarios.size - a.concesionarios.size || b.menciones - a.menciones)
    .map((it, i) => ({
      ranking: i + 1,
      tema: it.tema,
      fuente: it.fuente,
      concesionarios_que_lo_mencionan: it.concesionarios.size,
      total_menciones: it.menciones,
      zonas_presentes: Array.from(it.zonas).join(" | "),
    })) as Record<string, unknown>[];
}

async function buildInteresCollege(supabase: SB) {
  const { data: nec } = await supabase
    .from("necesidades")
    .select(
      "concesionario_id, interes_asotoy_college, cargos_dificiles_cubrir, habilidades_escasas, formacion_necesaria, comentarios_adicionales"
    );
  const concMap = await loadConcesionariosMap(supabase);

  const order: Record<string, number> = { si: 1, tal_vez: 2, no: 3, "": 4 };

  return (nec ?? [])
    .map((n) => {
      const c = concMap.get(n.concesionario_id as string);
      return {
        concesionario: c?.nombre ?? n.concesionario_id,
        zona: c?.zona ?? "",
        estado: c?.estado ?? "",
        interes: (n.interes_asotoy_college as string) ?? "",
        interes_label:
          n.interes_asotoy_college === "si"
            ? "Sí, interesado"
            : n.interes_asotoy_college === "tal_vez"
            ? "Tal vez"
            : n.interes_asotoy_college === "no"
            ? "No interesado"
            : "Sin respuesta",
        cargos_dificiles: n.cargos_dificiles_cubrir ?? "",
        habilidades_escasas: n.habilidades_escasas ?? "",
        formacion_necesaria: n.formacion_necesaria ?? "",
        comentarios: n.comentarios_adicionales ?? "",
      };
    })
    .sort(
      (a, b) =>
        (order[a.interes] ?? 99) - (order[b.interes] ?? 99) ||
        String(a.concesionario).localeCompare(String(b.concesionario))
    ) as Record<string, unknown>[];
}

async function buildBrechasEducativas(supabase: SB) {
  const { data: perf } = await supabase
    .from("perfiles_talento")
    .select(
      "cargo_id, educacion_minima, experiencia_minima_anios, certificacion_toyota_suficiente, formacion_adicional"
    );
  const cargos = await loadCargosMap(supabase);
  const cargoMap = new Map<string, { nombre_cargo: string; nivel_toyota: string | null }>();
  cargos.forEach((c) =>
    cargoMap.set(c.id as string, {
      nombre_cargo: c.nombre_cargo as string,
      nivel_toyota: c.nivel_toyota as string | null,
    })
  );

  const educLabel = (v: string | null | undefined) =>
    EDUCACION_MINIMA.find((e) => e.value === v)?.label ?? v ?? "—";

  type Bucket = {
    cargo: string;
    nivel: string;
    count: number;
    educ: Map<string, number>;
    expSum: number;
    certSufCount: number;
    formacion: Map<string, number>;
  };
  const buckets = new Map<string, Bucket>();

  (perf ?? []).forEach((p) => {
    const cargo = cargoMap.get(p.cargo_id as string);
    if (!cargo) return;
    const nombre = cargo.nombre_cargo ?? "—";
    const nivel = getNivelToyotaLabel(cargo.nivel_toyota);
    const key = `${nombre}||${nivel}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        cargo: nombre,
        nivel,
        count: 0,
        educ: new Map(),
        expSum: 0,
        certSufCount: 0,
        formacion: new Map(),
      });
    }
    const b = buckets.get(key)!;
    b.count += 1;
    const educ = educLabel(p.educacion_minima as string);
    b.educ.set(educ, (b.educ.get(educ) ?? 0) + 1);
    b.expSum += Number(p.experiencia_minima_anios ?? 0);
    if (p.certificacion_toyota_suficiente) b.certSufCount += 1;
    tokenizeFreeText(p.formacion_adicional as string).forEach((t) =>
      b.formacion.set(t, (b.formacion.get(t) ?? 0) + 1)
    );
  });

  const topEduc = (m: Map<string, number>) => {
    const sorted = Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? "—";
  };
  const topList = (m: Map<string, number>, n: number) =>
    Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k]) => k)
      .join(" | ");

  return Array.from(buckets.values())
    .sort((a, b) => a.cargo.localeCompare(b.cargo))
    .map((b) => ({
      cargo: b.cargo,
      nivel_toyota: b.nivel,
      registros: b.count,
      educacion_minima_mas_exigida: topEduc(b.educ),
      experiencia_promedio_anios: round(b.expSum / b.count, 1),
      pct_con_certificacion_toyota_suficiente: round(
        (b.certSufCount / b.count) * 100,
        1
      ),
      top_formacion_adicional: topList(b.formacion, 3),
    })) as Record<string, unknown>[];
}

// ---- Estratégico ----

async function buildEjecutivoConsolidado(supabase: SB) {
  const { data: concs } = await supabase
    .from("concesionarios")
    .select("id, formulario_estado, num_empleados, zona");
  const cargos = await loadCargosMap(supabase);
  const { data: nec } = await supabase
    .from("necesidades")
    .select("interes_asotoy_college, habilidades_escasas");

  const total = concs?.length ?? 0;
  const completados = (concs ?? []).filter((c) => c.formulario_estado === "completado").length;
  const enProgreso = (concs ?? []).filter((c) => c.formulario_estado === "en_progreso").length;
  const pendientes = total - completados - enProgreso;
  const totalPersonasDeclaradas = (concs ?? []).reduce((s, c) => s + (Number(c.num_empleados) || 0), 0);
  const totalPersonasCargos = cargos.reduce((s, c) => s + (Number(c.num_personas) || 0), 0);
  const totalCargosUnicos = cargos.length;

  // Distribución G1-G4
  const tecnicos = cargos.filter((c) =>
    ["tecnico_g1", "tecnico_g2", "tecnico_g3", "tecnico_g4", "ayudante"].includes(
      c.nivel_toyota as string
    )
  );
  const sumNivel = (v: string) =>
    tecnicos
      .filter((c) => c.nivel_toyota === v)
      .reduce((s, c) => s + (Number(c.num_personas) || 0), 0);
  const g1 = sumNivel("tecnico_g1");
  const g2 = sumNivel("tecnico_g2");
  const g3 = sumNivel("tecnico_g3");
  const g4 = sumNivel("tecnico_g4");
  const ayud = sumNivel("ayudante");
  const totalTec = g1 + g2 + g3 + g4 + ayud;

  // Certificación
  const certificadas = cargos
    .filter((c) => c.certificado_toyota)
    .reduce((s, c) => s + (Number(c.num_personas) || 0), 0);

  // Interés College
  const interesSi = (nec ?? []).filter((n) => n.interes_asotoy_college === "si").length;
  const interesTalVez = (nec ?? []).filter((n) => n.interes_asotoy_college === "tal_vez").length;
  const interesNo = (nec ?? []).filter((n) => n.interes_asotoy_college === "no").length;

  // Top habilidades escasas
  const idx = new Map<string, number>();
  (nec ?? []).forEach((n) =>
    tokenizeFreeText(n.habilidades_escasas as string).forEach((t) =>
      idx.set(t, (idx.get(t) ?? 0) + 1)
    )
  );
  const topHab = Array.from(idx.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => `${k} (${v})`)
    .join(" | ");

  // Zonas únicas
  const zonas = new Set((concs ?? []).map((c) => c.zona ?? "Sin zona"));

  const rows: Record<string, unknown>[] = [
    { indicador: "Concesionarios en el estudio", valor: total },
    { indicador: "Formularios completados", valor: completados },
    { indicador: "Formularios en progreso", valor: enProgreso },
    { indicador: "Formularios pendientes", valor: pendientes },
    {
      indicador: "% avance del estudio",
      valor: total > 0 ? `${round((completados / total) * 100, 1)}%` : "—",
    },
    { indicador: "Zonas geográficas cubiertas", valor: zonas.size },
    { indicador: "Total personas declaradas (num_empleados)", valor: totalPersonasDeclaradas },
    { indicador: "Total personas en cargos detallados", valor: totalPersonasCargos },
    { indicador: "Cargos únicos levantados", valor: totalCargosUnicos },
    { indicador: "Técnicos totales (G1-G4 + ayudantes)", valor: totalTec },
    { indicador: "Ayudantes", valor: ayud },
    { indicador: "Técnicos G1", valor: g1 },
    { indicador: "Técnicos G2", valor: g2 },
    { indicador: "Técnicos G3", valor: g3 },
    { indicador: "Técnicos G4", valor: g4 },
    {
      indicador: "% madurez técnica (G3+G4 / total técnicos)",
      valor: totalTec > 0 ? `${round(((g3 + g4) / totalTec) * 100, 1)}%` : "—",
    },
    {
      indicador: "% certificación Toyota (personas certificadas / total)",
      valor:
        totalPersonasCargos > 0
          ? `${round((certificadas / totalPersonasCargos) * 100, 1)}%`
          : "—",
    },
    { indicador: "Interés en ASOTOY College — Sí", valor: interesSi },
    { indicador: "Interés en ASOTOY College — Tal vez", valor: interesTalVez },
    { indicador: "Interés en ASOTOY College — No", valor: interesNo },
    { indicador: "Top 5 habilidades escasas a nivel nacional", valor: topHab || "—" },
  ];

  return rows;
}

async function buildMadurezRed(supabase: SB) {
  const cargos = await loadCargosMap(supabase);
  const concMap = await loadConcesionariosMap(supabase);

  type C = {
    concesionario: string;
    zona: string;
    estado: string;
    ayud: number;
    g1: number;
    g2: number;
    g3: number;
    g4: number;
    certificadas: number;
    totalPersonas: number;
  };
  const byConc = new Map<string, C>();

  cargos.forEach((c) => {
    const id = c.concesionario_id as string;
    const conc = concMap.get(id);
    if (!conc) return;
    if (!byConc.has(id)) {
      byConc.set(id, {
        concesionario: conc.nombre,
        zona: conc.zona ?? "Sin zona",
        estado: conc.estado ?? "",
        ayud: 0,
        g1: 0,
        g2: 0,
        g3: 0,
        g4: 0,
        certificadas: 0,
        totalPersonas: 0,
      });
    }
    const b = byConc.get(id)!;
    const n = Number(c.num_personas ?? 0);
    b.totalPersonas += n;
    if (c.certificado_toyota) b.certificadas += n;
    switch (c.nivel_toyota) {
      case "ayudante":
        b.ayud += n;
        break;
      case "tecnico_g1":
        b.g1 += n;
        break;
      case "tecnico_g2":
        b.g2 += n;
        break;
      case "tecnico_g3":
        b.g3 += n;
        break;
      case "tecnico_g4":
        b.g4 += n;
        break;
    }
  });

  const rows = Array.from(byConc.values())
    .map((b) => {
      const tec = b.ayud + b.g1 + b.g2 + b.g3 + b.g4;
      const maduros = b.g3 + b.g4;
      return {
        ...b,
        tecnicos_total: tec,
        pct_g3_g4: tec > 0 ? round((maduros / tec) * 100, 1) : 0,
        pct_certificacion:
          b.totalPersonas > 0
            ? round((b.certificadas / b.totalPersonas) * 100, 1)
            : 0,
      };
    })
    .sort((a, b) => b.pct_g3_g4 - a.pct_g3_g4);

  return rows.map((r, i) => ({
    ranking_madurez: i + 1,
    concesionario: r.concesionario,
    zona: r.zona,
    estado: r.estado,
    total_personas: r.totalPersonas,
    tecnicos_total: r.tecnicos_total,
    ayudantes: r.ayud,
    g1: r.g1,
    g2: r.g2,
    g3: r.g3,
    g4: r.g4,
    pct_g3_g4: r.pct_g3_g4,
    pct_certificacion_toyota: r.pct_certificacion,
  })) as Record<string, unknown>[];
}
