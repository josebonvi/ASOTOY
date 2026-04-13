import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FORMULARIO_SECCIONES } from "@/lib/constants";
import type { FormularioProgreso, OrganigramaEstado } from "@/lib/types";
import SeccionDatos from "@/components/forms/SeccionDatos";
import SeccionCargos from "@/components/forms/SeccionCargos";
import SeccionRemuneracion from "@/components/forms/SeccionRemuneracion";
import SeccionTalento from "@/components/forms/SeccionTalento";
import SeccionNecesidades from "@/components/forms/SeccionNecesidades";

export default async function FormularioSeccionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seccionId = parseInt(id);

  if (isNaN(seccionId) || seccionId < 1 || seccionId > 5) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: concesionario } = await supabase
    .from("concesionarios")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!concesionario) redirect("/login");

  // Check if formulario is already completed (read-only)
  const isCompleted = concesionario.formulario_estado === "completado";

  const progreso =
    (concesionario.formulario_progreso as FormularioProgreso) ?? {
      organigrama: false,
      seccion1: false,
      seccion2: false,
      seccion3: false,
      seccion4: false,
      seccion5: false,
    };

  const orgEstado = (concesionario.organigrama_estado as OrganigramaEstado) ?? "no_iniciado";

  // Check if section is blocked (section 2 requires approved organigrama; sections 3 & 4 require section 2)
  const seccionConfig = FORMULARIO_SECCIONES.find((s) => s.id === seccionId) as
    | (typeof FORMULARIO_SECCIONES)[number] & { requiere?: string }
    | undefined;
  if (seccionConfig?.requiere) {
    if (seccionConfig.requiere === "organigrama") {
      if (orgEstado !== "aprobado") {
        redirect("/organigrama");
      }
    } else if (!progreso[seccionConfig.requiere as keyof FormularioProgreso]) {
      redirect("/inicio");
    }
  }

  // Fetch section-specific data
  const { data: areas } = await supabase
    .from("areas")
    .select("*")
    .eq("concesionario_id", concesionario.id);

  const { data: cargos } = await supabase
    .from("cargos")
    .select("*")
    .eq("concesionario_id", concesionario.id);

  // Filter cargos for S3/S4: only mecánica-related areas
  const allCargos = cargos ?? [];
  const mecanicaCargos = allCargos.filter((c) => {
    const area = (c.area ?? "").toLowerCase();
    return (
      !c.area ||
      area.includes("mecánica") ||
      area.includes("mecanica") ||
      area === "taller mecánico" ||
      (area.includes("servicio") && !area.includes("repuesto") && !area.includes("latonería") && !area.includes("pintura"))
    );
  });

  const sectionComponents: Record<number, React.ReactNode> = {
    1: (
      <SeccionDatos
        concesionario={concesionario}
        areas={areas ?? []}
        readOnly={isCompleted}
      />
    ),
    2: (
      <SeccionCargos
        concesionarioId={concesionario.id}
        cargos={allCargos}
        areas={areas ?? []}
        organigramaAprobado={orgEstado === "aprobado"}
        readOnly={isCompleted}
      />
    ),
    3: (
      <SeccionRemuneracion
        concesionarioId={concesionario.id}
        cargos={mecanicaCargos}
        readOnly={isCompleted}
      />
    ),
    4: (
      <SeccionTalento
        concesionarioId={concesionario.id}
        cargos={mecanicaCargos}
        readOnly={isCompleted}
      />
    ),
    5: (
      <SeccionNecesidades
        concesionarioId={concesionario.id}
        readOnly={isCompleted}
      />
    ),
  };

  const seccion = FORMULARIO_SECCIONES.find((s) => s.id === seccionId);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
          Sección {seccionId} de 5
        </p>
        <h1 className="text-2xl font-bold">{seccion?.titulo}</h1>
        {isCompleted && (
          <p className="text-sm text-warning mt-2">
            El formulario ya fue enviado. Los datos son de solo lectura.
          </p>
        )}
      </div>
      {sectionComponents[seccionId]}
    </div>
  );
}
