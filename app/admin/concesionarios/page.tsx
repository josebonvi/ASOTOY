import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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

      {/* Seccion 1: Datos */}
      <section className="rounded-xl bg-card border border-border p-6 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Sección 1 — Datos del Concesionario
        </h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Empleados</dt>
            <dd className="font-medium">{concesionario.num_empleados ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Organigrama</dt>
            <dd className="font-medium">
              {concesionario.tiene_organigrama ? "Sí" : "No"}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground">Cadena de mando</dt>
            <dd className="font-medium">{concesionario.cadena_mando ?? "—"}</dd>
          </div>
        </dl>
        {areas && areas.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Áreas ({areas.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {areas.map((a) => (
                <span
                  key={a.id}
                  className="text-xs bg-accent px-2 py-1 rounded"
                >
                  {a.nombre_area}
                  {a.num_personas ? ` (${a.num_personas})` : ""}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Seccion 2: Cargos */}
      <section className="rounded-xl bg-card border border-border p-6 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Sección 2 — Cargos ({cargos?.length ?? 0})
        </h2>
        {cargos && cargos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">
                    Cargo
                  </th>
                  <th className="text-left py-2 text-muted-foreground font-medium">
                    Área
                  </th>
                  <th className="text-left py-2 text-muted-foreground font-medium">
                    Nivel Toyota
                  </th>
                  <th className="text-left py-2 text-muted-foreground font-medium">
                    Personas
                  </th>
                  <th className="text-left py-2 text-muted-foreground font-medium">
                    Cert.
                  </th>
                </tr>
              </thead>
              <tbody>
                {cargos.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="py-2">{c.nombre_cargo}</td>
                    <td className="py-2 text-muted-foreground">{c.area ?? "—"}</td>
                    <td className="py-2 text-muted-foreground">
                      {c.nivel_toyota ?? "—"}
                    </td>
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

      {/* Seccion 3: Rangos salariales */}
      <section className="rounded-xl bg-card border border-border p-6 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Sección 3 — Rangos Salariales ({rangos?.length ?? 0})
        </h2>
        {rangos && rangos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">
                    Cargo
                  </th>
                  <th className="text-left py-2 text-muted-foreground font-medium">
                    Min
                  </th>
                  <th className="text-left py-2 text-muted-foreground font-medium">
                    Max
                  </th>
                  <th className="text-left py-2 text-muted-foreground font-medium">
                    Tipo
                  </th>
                  <th className="text-left py-2 text-muted-foreground font-medium">
                    Moneda
                  </th>
                </tr>
              </thead>
              <tbody>
                {rangos.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-2">{r.cargo_id}</td>
                    <td className="py-2">{r.salario_min ?? "—"}</td>
                    <td className="py-2">{r.salario_max ?? "—"}</td>
                    <td className="py-2 text-muted-foreground">
                      {r.tipo_pago ?? "—"}
                    </td>
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

      {/* Seccion 4: Perfiles */}
      <section className="rounded-xl bg-card border border-border p-6 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Sección 4 — Perfiles de Talento ({perfiles?.length ?? 0})
        </h2>
        {perfiles && perfiles.length > 0 ? (
          <div className="space-y-3">
            {perfiles.map((p) => (
              <div key={p.id} className="border-b border-border pb-3 last:border-0">
                <p className="font-medium">{p.cargo_id}</p>
                <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-muted-foreground">
                  <span>Educación: {p.educacion_minima ?? "—"}</span>
                  <span>Experiencia: {p.experiencia_minima_anios ?? "—"} años</span>
                  <span>Habilidades: {p.habilidades_clave ?? "—"}</span>
                  <span>
                    Cert. Toyota suficiente:{" "}
                    {p.certificacion_toyota_suficiente ? "Sí" : "No"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin perfiles registrados.</p>
        )}
      </section>

      {/* Seccion 5: Necesidades */}
      <section className="rounded-xl bg-card border border-border p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Sección 5 — Necesidades y Brechas
        </h2>
        {necesidades && necesidades.length > 0 ? (
          <dl className="space-y-3 text-sm">
            {necesidades.map((n) => (
              <div key={n.id} className="space-y-3">
                <div>
                  <dt className="text-muted-foreground">
                    Cargos difíciles de cubrir
                  </dt>
                  <dd>{n.cargos_dificiles_cubrir ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Habilidades escasas</dt>
                  <dd>{n.habilidades_escasas ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Formación necesaria</dt>
                  <dd>{n.formacion_necesaria ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    Interés en ASOTOY College
                  </dt>
                  <dd>{n.interes_asotoy_college ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Comentarios</dt>
                  <dd>{n.comentarios_adicionales ?? "—"}</dd>
                </div>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Sin datos registrados.</p>
        )}
      </section>
    </div>
  );
}
