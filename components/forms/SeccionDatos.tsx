"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useFormProgress } from "@/hooks/useFormProgress";
import { ESTADOS_VENEZUELA } from "@/lib/constants";
import type { Concesionario, Area } from "@/lib/types";
import { DynamicTable, type ColumnConfig } from "@/components/forms/DynamicTable";
import { SaveIndicator } from "@/components/shared/SaveIndicator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const areaColumns: ColumnConfig[] = [
  {
    key: "nombre_area",
    label: "Nombre del área",
    type: "text",
    placeholder: "Ej: Servicio, Ventas, Administración",
  },
  {
    key: "num_personas",
    label: "N° personas",
    type: "number",
    placeholder: "0",
    width: "120px",
  },
];

interface SeccionDatosProps {
  concesionario: Concesionario;
  areas: Area[];
  readOnly?: boolean;
}

export default function SeccionDatos({
  concesionario,
  areas: initialAreas,
  readOnly,
}: SeccionDatosProps) {
  const router = useRouter();
  const supabase = createClient();
  const { markSectionComplete } = useFormProgress(concesionario.id);

  const [nombre, setNombre] = useState(concesionario.nombre ?? "");
  const [zona, setZona] = useState(concesionario.zona ?? "");
  const [estado, setEstado] = useState(concesionario.estado ?? "");
  const [ciudad, setCiudad] = useState(concesionario.ciudad ?? "");
  const [numEmpleados, setNumEmpleados] = useState<number | "">(
    concesionario.num_empleados ?? ""
  );
  const [tieneOrganigrama, setTieneOrganigrama] = useState(
    concesionario.tiene_organigrama ?? false
  );
  const [cadenaMando, setCadenaMando] = useState(
    concesionario.cadena_mando ?? ""
  );
  const [areas, setAreas] = useState<Record<string, unknown>[]>(
    initialAreas.length > 0
      ? initialAreas.map((a) => ({
          nombre_area: a.nombre_area,
          num_personas: a.num_personas,
        }))
      : [{ nombre_area: "", num_personas: null }]
  );

  const formData = {
    nombre,
    zona,
    estado,
    ciudad,
    numEmpleados,
    tieneOrganigrama,
    cadenaMando,
    areas,
  };

  const saveToDb = useCallback(
    async (data: typeof formData) => {
      // Update concesionario fields
      await supabase
        .from("concesionarios")
        .update({
          nombre: data.nombre,
          zona: data.zona,
          estado: data.estado,
          ciudad: data.ciudad,
          num_empleados: data.numEmpleados === "" ? null : data.numEmpleados,
          tiene_organigrama: data.tieneOrganigrama,
          cadena_mando: data.cadenaMando,
          formulario_estado: "en_progreso",
        })
        .eq("id", concesionario.id);

      // Replace areas: delete old ones and insert new
      await supabase
        .from("areas")
        .delete()
        .eq("concesionario_id", concesionario.id);

      const validAreas = data.areas.filter(
        (a) => (a.nombre_area as string)?.trim() !== ""
      );
      if (validAreas.length > 0) {
        await supabase.from("areas").insert(
          validAreas.map((a) => ({
            concesionario_id: concesionario.id,
            nombre_area: a.nombre_area as string,
            num_personas: a.num_personas as number | null,
          }))
        );
      }
    },
    [concesionario.id, supabase]
  );

  const { status } = useAutoSave({
    data: formData,
    onSave: saveToDb,
    enabled: !readOnly,
  });

  async function handleContinue() {
    await saveToDb(formData);
    await markSectionComplete("seccion1");
    router.push("/formulario/seccion-2");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Save indicator */}
      <div className="flex justify-end">
        <SaveIndicator status={status} />
      </div>

      {/* Basic info */}
      <div className="rounded-xl bg-card border border-border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del concesionario *</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zona">Zona geográfica</Label>
            <Input
              id="zona"
              value={zona}
              onChange={(e) => setZona(e.target.value)}
              placeholder="Ej: Central, Occidente, Oriente"
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estado">Estado *</Label>
            <select
              id="estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              disabled={readOnly}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"
            >
              <option value="">Seleccionar estado...</option>
              {ESTADOS_VENEZUELA.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ciudad">Ciudad</Label>
            <Input
              id="ciudad"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Ej: Caracas, Valencia"
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numEmpleados">N° total de empleados *</Label>
            <Input
              id="numEmpleados"
              type="number"
              value={numEmpleados}
              onChange={(e) =>
                setNumEmpleados(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              placeholder="0"
              min={1}
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Areas */}
      <div className="rounded-xl bg-card border border-border p-6">
        <h3 className="text-sm font-semibold mb-1">Áreas del concesionario *</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Indique las áreas o departamentos y cuántas personas tiene cada una.
        </p>
        <DynamicTable
          columns={areaColumns}
          data={areas}
          onChange={setAreas}
          minRows={1}
          addLabel="Agregar área"
        />
      </div>

      {/* Organigrama */}
      <div className="rounded-xl bg-card border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>¿Tienen organigrama formal?</Label>
            <p className="text-xs text-muted-foreground">
              Estructura organizativa documentada
            </p>
          </div>
          <Switch
            checked={tieneOrganigrama}
            onCheckedChange={setTieneOrganigrama}
            disabled={readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cadena">Descripción de la cadena de mando</Label>
          <Textarea
            id="cadena"
            value={cadenaMando}
            onChange={(e) => setCadenaMando(e.target.value)}
            placeholder="Describa brevemente cómo está organizada la jerarquía del concesionario..."
            rows={3}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Continue button */}
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
