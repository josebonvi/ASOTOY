import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNivelToyotaLabel } from "@/lib/constants";

export default async function ConcesionarioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: concesionario } = await supabase
    .from("concesionarios")
    .select("*")
    .eq("id", id)
    .single();

  if (!concesionario) notFound();

  const [
    { data: areas },
    { data: cargos },
    { data: rangos },
    { data: perfiles },
    { data: necesidades },
  ] = await Promise.all([
    supabase.from("areas").select("*").eq("concesionario_id", id),
    supabase.from("cargos").select("*").eq("concesionario_id", id),
    supabase.from("rangos_salariales").select("*").eq("concesionario_id", id),
    supabase.from("perfiles_talento").select("*").eq("concesionario_id", id),
    supabase.from("necesidades").select("*").eq("concesionario_id", id),
  ]);

  return (
    <div className="max-w-4xl">
      <Link href="/admin/concesionarios">
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground">
          <ArrowLeft size={16} className="mr-2" />
          Volver a la lista
        </Button>
      </Link>

      <h1 className="text-2xl font-bold mb-1">{concesionario.nombre}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {concesionario.zona} — {concesionario.estado}
      </p>

      {/* Seccion 1 */}
      <section className="rounded-xl bg-card border border-border p-6 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Sección 1 — Datos del Concesionario
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Empleados</p>
            <p className="font-medium">{concesionario.num_empleados ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Organigrama</p>
            <p className="font-medium">
              {concesionario.tiene_organigrama ? "Sí" : "No"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-muted-foreground text-xs">Cadena de mando</p>
            <p className="font-medium">{concesionario.cadena_mando ?? "—"}</p>
          </div>
        </div>
        {areas && areas.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Áreas ({areas.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {areas.map((a) => (
                <span key={a.id} className="text-xs bg-accent px-2 py-1 rounded">
                  {a.nombre_area}{a.num_personas ? ` (${a.num_personas})` : ""}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Seccion 2 */}
      <section className="rounded-xl bg-card border border-border p-6 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Sección 2 — Cargos ({cargos?.length ?? 0})
        </h2>
        {cargos && cargos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Cargo</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Área</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Nivel Toyota</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Personas</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Cert.</th>
                </tr>
              </thead>
              <tbody>
                {cargos.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="py-2">{c.nombre_cargo}</td>
                    <td className="py-2 text-muted-foreground">{c.area ?? "—"}</td>
                    <td className="py-2 text-muted-foreground">{getNivelToyotaLabel(c.nivel_toyota)}</td>
                    <td className="py-2">{c.num_personas ?? "—"}</td>
                    <td className="py-2">{c.certificado_toyota ? "✓" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin cargos registrados.</p>
        )}
      </section>

      {/* Seccion 3 */}
      <section className="rounded-xl bg-card border border-border p-6 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Sección 3 — Rangos Salariales ({rangos?.length ?? 0})
        </h2>
        {rangos && rangos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Min</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Max</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Tipo</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Moneda</th>
                </tr>
              </thead>
              <tbody>
                {rangos.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-2">{r.salario_min ?? "—"}</td>
                    <td className="py-2">{r.salario_max ?? "—"}</td>
                    <td className="py-2 text-muted-foreground">{r.tipo_pago ?? "—"}</td>
                    <td className="py-2">{r.moneda}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin rangos registrados.</p>
        )}
      </section>

      {/* Seccion 4 */}
      <section className="rounded-xl bg-card border border-border p-6 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Sección 4 — Perfiles de Talento ({perfiles?.length ?? 0})
        </h2>
        {perfiles && perfiles.length > 0 ? (
          <div className="space-y-3">
            {perfiles.map((p) => (
              <div key={p.id} className="border-b border-border pb-3 last:border-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Educación: {p.educacion_minima ?? "—"}</span>
                  <span>Experiencia: {p.experiencia_minima_anios ?? "—"} años</span>
                  <span>Habilidades: {p.habilidades_clave ?? "—"}</span>
                  <span>Cert. Toyota suf.: {p.certificacion_toyota_suficiente ? "Sí" : "No"}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin perfiles registrados.</p>
        )}
      </section>

      {/* Seccion 5 */}
      <section className="rounded-xl bg-card border border-border p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Sección 5 — Necesidades y Brechas
        </h2>
        {necesidades && necesidades.length > 0 ? (
          <div className="space-y-3 text-sm">
            {necesidades.map((n) => (
              <div key={n.id} className="space-y-3">
                <div>
                  <p className="text-muted-foreground text-xs">Cargos difíciles de cubrir</p>
                  <p>{n.cargos_dificiles_cubrir ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Habilidades escasas</p>
                  <p>{n.habilidades_escasas ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Formación necesaria</p>
                  <p>{n.formacion_necesaria ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Interés en ASOTOY College</p>
                  <p>{n.interes_asotoy_college ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Comentarios</p>
                  <p>{n.comentarios_adicionales ?? "—"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin datos registrados.</p>
        )}
      </section>
    </div>
  );
}
