"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useFormProgress } from "@/hooks/useFormProgress";
import { EDUCACION_MINIMA } from "@/lib/constants";
import type { Cargo } from "@/lib/types";
import { DynamicTable, type ColumnConfig } from "@/components/forms/DynamicTable";
import { SaveIndicator } from "@/components/shared/SaveIndicator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle } from "lucide-react";

const perfilColumns: ColumnConfig[] = [
  { key: "cargo_nombre", label: "Cargo", type: "text", readOnly: true },
  {
    key: "educacion_minima",
    label: "Educación mín.",
    type: "select",
    options: [...EDUCACION_MINIMA],
  },
  {
    key: "certificacion_toyota_suficiente",
    label: "Cert. Toyota suf.",
    type: "toggle",
    width: "100px",
  },
  {
    key: "formacion_adicional",
    label: "Formación adicional",
    type: "text",
    placeholder: "Ej: Curso de electrónica",
  },
  {
    key: "experiencia_minima_anios",
    label: "Exp. mín. (años)",
    type: "number",
    placeholder: "0",
    width: "100px",
  },
  {
    key: "habilidades_clave",
    label: "Habilidades clave",
    type: "text",
    placeholder: "Ej: Diagnóstico, liderazgo",
  },
];

interface SeccionTalentoProps {
  concesionarioId: string;
  cargos: Cargo[];
  readOnly?: boolean;
}

export default function SeccionTalento({
  concesionarioId,
  cargos,
  readOnly,
}: SeccionTalentoProps) {
  const router = useRouter();
  const supabase = createClient();
  const { markSectionComplete } = useFormProgress(concesionarioId);

  const [perfiles, setPerfiles] = useState<Record<string, unknown>[]>([]);
  const [habilidadesFaltantes, setHabilidadesFaltantes] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      // Use all cargos for this concesionario (no longer filtered by CARGOS_MECANICA)
      const tallerCargos = cargos;

      const { data: existingPerfiles } = await supabase
        .from("perfiles_talento")
        .select("*")
        .eq("concesionario_id", concesionarioId);

      if (existingPerfiles && existingPerfiles.length > 0) {
        setPerfiles(
          tallerCargos.map((cargo) => {
            const existing = existingPerfiles.find(
              (p) => p.cargo_id === cargo.id
            );
            return {
              cargo_id: cargo.id,
              cargo_nombre: cargo.nombre_cargo_dealer
                ? `${cargo.nombre_cargo} (${cargo.nombre_cargo_dealer})`
                : cargo.nombre_cargo,
              educacion_minima: existing?.educacion_minima ?? "",
              certificacion_toyota_suficiente:
                existing?.certificacion_toyota_suficiente ?? false,
              formacion_adicional: existing?.formacion_adicional ?? "",
              experiencia_minima_anios:
                existing?.experiencia_minima_anios ?? null,
              habilidades_clave: existing?.habilidades_clave ?? "",
            };
          })
        );
        const withFaltantes = existingPerfiles.find(
          (p) => p.habilidades_faltantes
        );
        if (withFaltantes)
          setHabilidadesFaltantes(withFaltantes.habilidades_faltantes);
      } else {
        setPerfiles(
          tallerCargos.map((cargo) => ({
            cargo_id: cargo.id,
            cargo_nombre: cargo.nombre_cargo,
            educacion_minima: "",
            certificacion_toyota_suficiente: false,
            formacion_adicional: "",
            experiencia_minima_anios: null,
            habilidades_clave: "",
          }))
        );
      }
      setLoaded(true);
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formData = { perfiles, habilidadesFaltantes };

  const saveToDb = useCallback(
    async (data: typeof formData) => {
      await supabase
        .from("perfiles_talento")
        .delete()
        .eq("concesionario_id", concesionarioId);

      const validPerfiles = data.perfiles.filter((p) => p.cargo_id);
      if (validPerfiles.length > 0) {
        await supabase.from("perfiles_talento").insert(
          validPerfiles.map((p) => ({
            concesionario_id: concesionarioId,
            cargo_id: p.cargo_id as string,
            educacion_minima: (p.educacion_minima as string) || null,
            certificacion_toyota_suficiente:
              p.certificacion_toyota_suficiente as boolean,
            formacion_adicional: (p.formacion_adicional as string) || null,
            experiencia_minima_anios:
              p.experiencia_minima_anios as number | null,
            habilidades_clave: (p.habilidades_clave as string) || null,
            habilidades_faltantes: data.habilidadesFaltantes || null,
          }))
        );
      }
    },
    [concesionarioId, supabase]
  );

  const { status } = useAutoSave({
    data: formData,
    onSave: saveToDb,
    enabled: !readOnly && loaded,
  });

  async function handleContinue() {
    await saveToDb(formData);
    await markSectionComplete("seccion4");
    router.push("/formulario/5");
    router.refresh();
  }

  if (!loaded) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Cargando datos...
      </div>
    );
  }

  if (cargos.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-warning/30 p-8 text-center">
        <AlertTriangle size={32} className="text-warning mx-auto mb-3" />
        <p className="font-medium">No hay cargos definidos</p>
        <p className="text-sm text-muted-foreground mt-1">
          Complete primero la Sección 2 para definir los cargos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <SaveIndicator status={status} />
      </div>

      {/* Profiles table */}
      <div className="rounded-xl bg-card border border-border p-6">
        <h3 className="text-sm font-semibold mb-1">
          Perfil del talento por cargo
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Los cargos se pre-llenaron de la Sección 2. Indique el perfil mínimo
          requerido para cada uno.
        </p>
        <DynamicTable
          columns={perfilColumns}
          data={perfiles}
          onChange={setPerfiles}
          minRows={perfiles.length}
        />
      </div>

      {/* Missing skills */}
      <div className="rounded-xl bg-card border border-border p-6 space-y-2">
        <Label>
          ¿Qué le falta al equipo actual en general?
        </Label>
        <Textarea
          value={habilidadesFaltantes}
          onChange={(e) => setHabilidadesFaltantes(e.target.value)}
          placeholder="Describa las habilidades o competencias que su equipo necesita desarrollar..."
          rows={3}
          disabled={readOnly}
        />
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={handleContinue} className="gap-2">
            Guardar y continuar
            <ArrowRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
