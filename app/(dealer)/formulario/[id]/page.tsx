import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FORMULARIO_SECCIONES, CONCESIONARIOS_SOLO_MECANICA } from "@/lib/constants";
import type { FormularioProgreso, OrganigramaEstado } from "@/lib/types";
import SeccionDatos from "@/components/forms/SeccionDatos";
import SeccionCargos from "@/components/forms/SeccionCargos";
import SeccionRemuneracion from "@/components/forms/SeccionRemuneracion";
import SeccionTalento from "@/components/forms/SeccionTalento";
import SeccionNecesidades from "@/components/forms/SeccionNecesidades";
import { ProgressStepper } from "@/components/shared/ProgressStepper";
import { FadeIn } from "@/components/shared/FadeIn";

const sectionDescriptions: Record<number, string> = {
  1: "Confirme los datos basicos de su concesionario. Esta informacion nos permite organizar los resultados por zona geografica.",
  2: "Revise los cargos de su departamento. Estos fueron pre-cargados desde su organigrama para facilitarle el trabajo.",
  3: "Indique los rangos salariales para cada cargo. Toda la informacion es estrictamente confidencial y se reporta en promedios agregados.",
  4: "Describa el perfil ideal para cada cargo. Esto nos permite identificar oportunidades de formacion en la red.",
  5: "Cuentenos que necesita su equipo. Estas respuestas alimentan directamente el programa ASOTOY College.",
};

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

  // Determine if this concesionario only fills detailed questions for mecánica
  const nombreLower = (concesionario.nombre ?? "").toLowerCase();
  const soloMecanica = CONCESIONARIOS_SOLO_MECANICA.some((n) => nombreLower === n);

  const allCargos = cargos ?? [];

  // Filter cargos for S3/S4: only mecánica-related areas (when applicable)
  const cargosParaPreguntas = soloMecanica
    ? allCargos.filter((c) => {
        const area = (c.area ?? "").toLowerCase();
        return (
          !c.area ||
          area.includes("mecánica") ||
          area.includes("mecanica") ||
          area === "taller mecánico" ||
          (area.includes("servicio") && !area.includes("repuesto") && !area.includes("latonería") && !area.includes("pintura"))
        );
      })
    : allCargos;

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
        soloMecanica={soloMecanica}
        readOnly={isCompleted}
      />
    ),
    3: (
      <SeccionRemuneracion
        concesionarioId={concesionario.id}
        cargos={cargosParaPreguntas}
        soloMecanica={soloMecanica}
        readOnly={isCompleted}
      />
    ),
    4: (
      <SeccionTalento
        concesionarioId={concesionario.id}
        cargos={cargosParaPreguntas}
        soloMecanica={soloMecanica}
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
    <div className="max-w-4xl mx-auto w-full">
      {/* Progress Stepper */}
      <div className="mb-8">
        <ProgressStepper currentSection={seccionId} progreso={progreso} />
      </div>

      {/* Section Header with Description */}
      <FadeIn>
        <div className="mb-8 relative">
          {/* Decorative section number */}
          <span className="absolute -left-2 -top-4 text-6xl font-bold text-primary/10 select-none pointer-events-none">
            {seccionId}
          </span>

          <div className="relative pl-8 sm:pl-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              Seccion {seccionId} de 5
            </p>
            <h1 className="text-xl font-semibold mb-2">{seccion?.titulo}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {sectionDescriptions[seccionId]}
            </p>
            {isCompleted && (
              <p className="text-sm text-warning mt-3">
                El formulario ya fue enviado. Los datos son de solo lectura.
              </p>
            )}
          </div>
        </div>

        {sectionComponents[seccionId]}
      </FadeIn>
    </div>
  );
}
