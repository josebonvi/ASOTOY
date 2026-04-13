import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OrganigramaPageClient from "@/components/organigrama/OrganigramaPageClient";

// ─── Types for data passed to client ────────────────────────────────────────

export interface OrganigramaPageData {
  concesionarioId: string;
  concesionarioNombre: string;
  organigramaEstado: string;
  organigrama: {
    id: string;
    tipo: "builder" | "upload";
    archivo_nombre?: string | null;
    archivo_url?: string | null;
    created_at: string;
  } | null;
  departamentos: {
    nombre: string;
    cargos: { nombre: string; numPersonas: number }[];
  }[];
}

// ─── Server Component ───────────────────────────────────────────────────────

export default async function OrganigramaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch concesionario
  const { data: concesionario } = await supabase
    .from("concesionarios")
    .select("id, nombre, organigrama_estado")
    .eq("user_id", user.id)
    .single();

  if (!concesionario) notFound();

  const estado = concesionario.organigrama_estado ?? "no_iniciado";

  // Fetch existing organigrama if any
  let organigrama: OrganigramaPageData["organigrama"] = null;
  let departamentos: OrganigramaPageData["departamentos"] = [];

  if (estado !== "no_iniciado") {
    const { data: orgData } = await supabase
      .from("organigramas")
      .select("id, tipo, archivo_nombre, archivo_url, created_at")
      .eq("concesionario_id", concesionario.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (orgData) {
      organigrama = orgData as OrganigramaPageData["organigrama"];

      // If builder type, fetch cargos and group by departamento
      if (orgData.tipo === "builder") {
        const { data: cargos } = await supabase
          .from("organigrama_cargos")
          .select("nombre_cargo_dealer, departamento, num_personas, orden")
          .eq("organigrama_id", orgData.id)
          .order("orden", { ascending: true });

        if (cargos && cargos.length > 0) {
          // Group cargos by departamento
          const deptoMap = new Map<
            string,
            { nombre: string; numPersonas: number }[]
          >();

          for (const cargo of cargos) {
            const deptoName = cargo.departamento ?? "Sin departamento";
            if (!deptoMap.has(deptoName)) {
              deptoMap.set(deptoName, []);
            }
            deptoMap.get(deptoName)!.push({
              nombre: cargo.nombre_cargo_dealer,
              numPersonas: cargo.num_personas,
            });
          }

          departamentos = Array.from(deptoMap.entries()).map(
            ([nombre, cargos]) => ({
              nombre,
              cargos,
            })
          );
        }
      }
    }
  }

  const pageData: OrganigramaPageData = {
    concesionarioId: concesionario.id,
    concesionarioNombre: concesionario.nombre,
    organigramaEstado: estado,
    organigrama,
    departamentos,
  };

  return <OrganigramaPageClient data={pageData} />;
}
