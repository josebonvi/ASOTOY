import { createClient } from "@/lib/supabase/server";
import ResultadosDashboard, { type DashboardData } from "./ResultadosDashboard";

export default async function ResultadosPage() {
  const supabase = await createClient();

  // Parallel fetch all tables
  const [
    { data: concesionarios },
    { data: cargos },
    { data: rangos },
    { data: perfiles },
    { data: necesidades },
  ] = await Promise.all([
    supabase
      .from("concesionarios")
      .select("id, nombre, zona, estado, ciudad, num_empleados, organigrama_estado, formulario_estado"),
    supabase
      .from("cargos")
      .select("id, concesionario_id, nombre_cargo, nombre_cargo_dealer, area, nivel_toyota, num_personas, certificado_toyota, pre_populated"),
    supabase
      .from("rangos_salariales")
      .select("id, concesionario_id, cargo_id, moneda, salario_min, salario_max, tipo_pago"),
    supabase
      .from("perfiles_talento")
      .select("id, concesionario_id, cargo_id, educacion_minima, experiencia_minima_anios, habilidades_clave, certificacion_toyota_suficiente"),
    supabase
      .from("necesidades")
      .select("id, concesionario_id, cargos_dificiles_cubrir, habilidades_escasas, formacion_necesaria, interes_asotoy_college"),
  ]);

  const safeConc = concesionarios ?? [];
  const safeCargos = cargos ?? [];
  const safeRangos = rangos ?? [];
  const safePerfiles = perfiles ?? [];
  const safeNecesidades = necesidades ?? [];

  // ---- Section 1: KPIs ----
  const totalPersonas = safeCargos.reduce(
    (sum, c) => sum + (c.num_personas ?? 0),
    0
  );
  const totalCargos = safeCargos.length;
  const concesionariosCompletos = safeConc.filter(
    (c) => c.formulario_estado === "completado"
  ).length;
  const concesionariosPendientes = safeConc.length - concesionariosCompletos;

  const cargosConCert = safeCargos.filter((c) => c.certificado_toyota === true);
  const pctCertificacion =
    totalCargos > 0 ? Math.round((cargosConCert.length / totalCargos) * 100) : 0;

  // ---- Section 2: Nivel Toyota distribution ----
  const nivelMap = new Map<string, number>();
  for (const cargo of safeCargos) {
    const nivel = cargo.nivel_toyota || "Sin definir";
    nivelMap.set(nivel, (nivelMap.get(nivel) ?? 0) + (cargo.num_personas ?? 0));
  }
  const nivelOrder = ["Ayudante", "G1", "G2", "G3", "G4", "No aplica", "Sin definir"];
  const nivelToyota = nivelOrder
    .filter((n) => nivelMap.has(n))
    .map((n) => ({ nivel: n, personas: nivelMap.get(n)! }));

  // ---- Section 3: Zonas ----
  // Build concesionario ID -> zona lookup
  const concZona = new Map<string, string>();
  for (const c of safeConc) {
    concZona.set(c.id, c.zona || "Sin zona");
  }

  const zonaPersonas = new Map<string, number>();
  const zonaCargos = new Map<string, number>();
  for (const cargo of safeCargos) {
    const zona = concZona.get(cargo.concesionario_id) ?? "Sin zona";
    zonaPersonas.set(
      zona,
      (zonaPersonas.get(zona) ?? 0) + (cargo.num_personas ?? 0)
    );
    zonaCargos.set(zona, (zonaCargos.get(zona) ?? 0) + 1);
  }
  const zonas = Array.from(zonaPersonas.entries())
    .map(([zona, personas]) => ({
      zona,
      personas,
      cargos: zonaCargos.get(zona) ?? 0,
    }))
    .sort((a, b) => b.personas - a.personas);

  // ---- Section 4: Salarios por nivel ----
  // Build cargo ID -> nivel lookup
  const cargoNivel = new Map<string, string>();
  for (const c of safeCargos) {
    cargoNivel.set(c.id, c.nivel_toyota || "Sin definir");
  }

  const salarioAgg = new Map<
    string,
    { sumMin: number; sumMax: number; count: number }
  >();
  for (const r of safeRangos) {
    const nivel = cargoNivel.get(r.cargo_id) ?? "Sin definir";
    const entry = salarioAgg.get(nivel) ?? { sumMin: 0, sumMax: 0, count: 0 };
    entry.sumMin += r.salario_min ?? 0;
    entry.sumMax += r.salario_max ?? 0;
    entry.count += 1;
    salarioAgg.set(nivel, entry);
  }
  const salariosPorNivel = nivelOrder
    .filter((n) => salarioAgg.has(n))
    .map((n) => {
      const e = salarioAgg.get(n)!;
      return {
        nivel: n,
        salario_min_avg: e.count > 0 ? Math.round(e.sumMin / e.count) : 0,
        salario_max_avg: e.count > 0 ? Math.round(e.sumMax / e.count) : 0,
      };
    });

  // ---- Section 5: Certificacion por concesionario ----
  const concNombres = new Map<string, string>();
  for (const c of safeConc) {
    concNombres.set(c.id, c.nombre);
  }

  const certAgg = new Map<string, { total: number; cert: number }>();
  for (const cargo of safeCargos) {
    const cid = cargo.concesionario_id;
    const entry = certAgg.get(cid) ?? { total: 0, cert: 0 };
    entry.total += 1;
    if (cargo.certificado_toyota) entry.cert += 1;
    certAgg.set(cid, entry);
  }
  const certificacionPorConc = Array.from(certAgg.entries())
    .map(([cid, e]) => ({
      concesionario: concNombres.get(cid) ?? cid,
      pct: e.total > 0 ? Math.round((e.cert / e.total) * 100 * 10) / 10 : 0,
    }))
    .sort((a, b) => b.pct - a.pct);

  // ---- Section 6: Necesidades ----
  // Collect all non-empty text fields, count frequency
  function aggregateTextArrays(
    items: (string | string[] | null | undefined)[]
  ): string[] {
    const freq = new Map<string, number>();
    for (const item of items) {
      if (!item) continue;
      const texts = Array.isArray(item) ? item : [item];
      for (const raw of texts) {
        if (!raw || typeof raw !== "string") continue;
        // Split by commas or semicolons if present
        const parts = raw
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean);
        for (const p of parts) {
          const normalized = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
          freq.set(normalized, (freq.get(normalized) ?? 0) + 1);
        }
      }
    }
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([text, count]) => `${text} (${count})`);
  }

  const cargosDificiles = aggregateTextArrays(
    safeNecesidades.map((n) => n.cargos_dificiles_cubrir)
  );
  const habilidadesEscasas = aggregateTextArrays(
    safeNecesidades.map((n) => n.habilidades_escasas)
  );
  const formacionNecesaria = aggregateTextArrays(
    safeNecesidades.map((n) => n.formacion_necesaria)
  );

  // ASOTOY College interest
  const interesCollege = { si: 0, no: 0, tal_vez: 0 };
  for (const n of safeNecesidades) {
    const val = (n.interes_asotoy_college ?? "").toLowerCase().trim();
    if (val === "si" || val === "sí") interesCollege.si += 1;
    else if (val === "no") interesCollege.no += 1;
    else if (val === "tal_vez" || val === "tal vez" || val === "talvez")
      interesCollege.tal_vez += 1;
  }

  // ---- Section 7: Perfil de Talento ----
  // Experience by nivel
  const expAgg = new Map<string, { sum: number; count: number }>();
  for (const p of safePerfiles) {
    const nivel = cargoNivel.get(p.cargo_id) ?? "Sin definir";
    const entry = expAgg.get(nivel) ?? { sum: 0, count: 0 };
    if (p.experiencia_minima_anios != null) {
      entry.sum += p.experiencia_minima_anios;
      entry.count += 1;
    }
    expAgg.set(nivel, entry);
  }
  const experienciaPorNivel = nivelOrder
    .filter((n) => expAgg.has(n) && expAgg.get(n)!.count > 0)
    .map((n) => {
      const e = expAgg.get(n)!;
      return {
        nivel: n,
        experiencia_avg:
          Math.round((e.sum / e.count) * 10) / 10,
      };
    });

  // Education distribution
  const eduFreq = new Map<string, number>();
  for (const p of safePerfiles) {
    if (!p.educacion_minima) continue;
    const edu =
      p.educacion_minima.charAt(0).toUpperCase() +
      p.educacion_minima.slice(1).toLowerCase();
    eduFreq.set(edu, (eduFreq.get(edu) ?? 0) + 1);
  }
  const educacionDist = Array.from(eduFreq.entries())
    .map(([educacion, cantidad]) => ({ educacion, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);

  // ---- Build dashboard data payload ----
  const dashboardData: DashboardData = {
    kpis: {
      totalPersonas,
      totalCargos,
      concesionariosCompletos,
      concesionariosPendientes,
      pctCertificacion,
    },
    nivelToyota,
    zonas,
    salariosPorNivel,
    certificacionPorConc,
    necesidades: {
      cargosDificiles,
      habilidadesEscasas,
      formacionNecesaria,
      interesCollege,
    },
    experienciaPorNivel,
    educacionDist,
  };

  return (
    <div className="max-w-6xl mx-auto w-full">
      <h1 className="text-2xl font-bold mb-1">Resultados</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Dashboards agregados del estudio de remuneracion
      </p>
      <ResultadosDashboard data={dashboardData} />
    </div>
  );
}
