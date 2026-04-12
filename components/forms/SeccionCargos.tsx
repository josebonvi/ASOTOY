"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useFormProgress } from "@/hooks/useFormProgress";
import { NIVELES_TOYOTA, CARGOS_MECANICA, AREAS_TALLER } from "@/lib/constants";
import type { Cargo, Area } from "@/lib/types";
import { DynamicTable, type ColumnConfig } from "@/components/forms/DynamicTable";
import { SaveIndicator } from "@/components/shared/SaveIndicator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface SeccionCargosProps {
  concesionarioId: string;
  cargos: Cargo[];
  areas: Area[];
  readOnly?: boolean;
}

export default function SeccionCargos({
  concesionarioId,
  cargos: initialCargos,
  areas,
  readOnly,
}: SeccionCargosProps) {
  const router = useRouter();
  const supabase = createClient();
  const { markSectionComplete } = useFormProgress(concesionarioId);

  // Build cargo options grouped by category
  const categoriaLabels: Record<string, string> = {
    tecnico: "— Técnicos —",
    supervision: "— Supervisión —",
    atencion: "— Atención al cliente —",
    soporte: "— Soporte operativo —",
    administrativo: "— Administrativo —",
  };

  const cargoOptions: { value: string; label: string }[] = [];
  let lastCat = "";
  for (const c of CARGOS_MECANICA) {
    if (c.categoria !== lastCat) {
      cargoOptions.push({ value: `__header_${c.categoria}`, label: categoriaLabels[c.categoria] ?? c.categoria });
      lastCat = c.categoria;
    }
    cargoOptions.push({ value: c.value, label: c.label });
  }

  // Combine areas from DB + taller standard areas
  const areaOptions = [
    ...AREAS_TALLER.map((a) => ({ value: a.value, label: a.label })),
    ...areas
      .filter((a) => !AREAS_TALLER.some((at) => at.value === a.nombre_area || at.label === a.nombre_area))
      .map((a) => ({ value: a.nombre_area, label: a.nombre_area })),
  ];

  const cargoColumns: ColumnConfig[] = [
    {
      key: "nombre_cargo",
      label: "Cargo",
      type: "select",
      options: cargoOptions,
    },
    {
      key: "area",
      label: "Área del taller",
      type: "select",
      options: areaOptions,
    },
    {
      key: "nivel_toyota",
      label: "Nivel Toyota",
      type: "select",
      options: NIVELES_TOYOTA.map((n) => ({ value: n.value, label: `${n.label} (${n.equivalencia})` })),
    },
    {
      key: "nivel_interno",
      label: "Nombre interno",
      type: "text",
      placeholder: "Ej: G1, Junior, Senior",
    },
    {
      key: "num_personas",
      label: "N° personas",
      type: "number",
      placeholder: "0",
      width: "100px",
    },
    {
      key: "certificado_toyota",
      label: "Cert. Toyota",
      type: "toggle",
      width: "90px",
    },
  ];

  const [cargosData, setCargosData] = useState<Record<string, unknown>[]>(
    initialCargos.length > 0
      ? initialCargos.map((c) => ({
          nombre_cargo: c.nombre_cargo,
          area: c.area ?? "",
          nivel_toyota: c.nivel_toyota ?? "",
          nivel_interno: c.nivel_interno ?? "",
          num_personas: c.num_personas,
          certificado_toyota: c.certificado_toyota,
        }))
      : [
          {
            nombre_cargo: "",
            area: "",
            nivel_toyota: "",
            nivel_interno: "",
            num_personas: null,
            certificado_toyota: false,
          },
        ]
  );

  const [evaluacionesToyota, setEvaluacionesToyota] = useState(false);
  const [evaluacionesDetalle, setEvaluacionesDetalle] = useState("");
  const [motivoRotacion, setMotivoRotacion] = useState(
    initialCargos.find((c) => c.motivo_rotacion)?.motivo_rotacion ?? ""
  );

  const formData = {
    cargosData,
    evaluacionesToyota,
    evaluacionesDetalle,
    motivoRotacion,
  };

  const saveToDb = useCallback(
    async (data: typeof formData) => {
      // Delete old cargos and insert new ones
      await supabase
        .from("cargos")
        .delete()
        .eq("concesionario_id", concesionarioId);

      const validCargos = data.cargosData.filter(
        (c) => (c.nombre_cargo as string)?.trim() !== ""
      );

      if (validCargos.length > 0) {
        await supabase.from("cargos").insert(
          validCargos.map((c) => ({
            concesionario_id: concesionarioId,
            nombre_cargo: c.nombre_cargo as string,
            area: (c.area as string) || null,
            nivel_toyota: (c.nivel_toyota as string) || null,
            nivel_interno: (c.nivel_interno as string) || null,
            num_personas: c.num_personas as number | null,
            certificado_toyota: c.certificado_toyota as boolean,
            motivo_rotacion: data.motivoRotacion || null,
          }))
        );
      }
    },
    [concesionarioId, supabase]
  );

  const { status } = useAutoSave({
    data: formData,
    onSave: saveToDb,
    enabled: !readOnly,
  });

  async function handleContinue() {
    await saveToDb(formData);
    await markSectionComplete("seccion2");
    router.push("/formulario/3");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <SaveIndicator status={status} />
      </div>

      {/* Cargos table */}
      <div className="rounded-xl bg-card border border-border p-6">
        <h3 className="text-sm font-semibold mb-1">
          Cargos del departamento de mecánica *
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Seleccione los cargos que existen en su taller mecánico, indique
          el nivel Toyota equivalente y cuántas personas ocupan cada cargo.
        </p>
        <DynamicTable
          columns={cargoColumns}
          data={cargosData}
          onChange={setCargosData}
          minRows={1}
          addLabel="Agregar cargo"
        />
      </div>

      {/* Toyota evaluations */}
      <div className="rounded-xl bg-card border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>
              ¿Las evaluaciones de Toyota afectan la estructura del
              concesionario?
            </Label>
          </div>
          <Switch
            checked={evaluacionesToyota}
            onCheckedChange={setEvaluacionesToyota}
            disabled={readOnly}
          />
        </div>
        {evaluacionesToyota && (
          <Textarea
            value={evaluacionesDetalle}
            onChange={(e) => setEvaluacionesDetalle(e.target.value)}
            placeholder="Describa cómo afectan las evaluaciones de Toyota..."
            rows={3}
            disabled={readOnly}
          />
        )}
      </div>

      {/* Rotation */}
      <div className="rounded-xl bg-card border border-border p-6 space-y-4">
        <div className="space-y-2">
          <Label>Motivo principal de rotación de personal</Label>
          <Textarea
            value={motivoRotacion}
            onChange={(e) => setMotivoRotacion(e.target.value)}
            placeholder="¿Por qué renuncian o son despedidos los empleados con más frecuencia?"
            rows={3}
            disabled={readOnly}
          />
        </div>
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
