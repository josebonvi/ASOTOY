import { createClient } from "@/lib/supabase/server";
import ConcesionariosTable from "@/components/admin/ConcesionariosTable";
import type { FormularioEstado, FormularioProgreso, OrganigramaEstado } from "@/lib/types";

export default async function ConcesionariosPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("concesionarios")
    .select(
      "id, nombre, zona, estado, formulario_estado, formulario_progreso, organigrama_estado, updated_at"
    )
    .order("nombre");

  const concesionarios = (data ?? []).map((c) => ({
    id: c.id as string,
    nombre: c.nombre as string,
    zona: c.zona as string | null,
    estado: c.estado as string | null,
    formulario_estado: c.formulario_estado as FormularioEstado,
    formulario_progreso: (c.formulario_progreso as FormularioProgreso) ?? {
      organigrama: false,
      seccion1: false,
      seccion2: false,
      seccion3: false,
      seccion4: false,
      seccion5: false,
    },
    organigrama_estado: (c.organigrama_estado as OrganigramaEstado) ?? "no_iniciado",
    updated_at: c.updated_at as string,
  }));

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Concesionarios</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {concesionarios.length} concesionarios registrados
        </p>
      </div>

      <ConcesionariosTable concesionarios={concesionarios} />
    </div>
  );
}
