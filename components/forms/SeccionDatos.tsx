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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Lock } from "lucide-react";
import { motion } from "framer-motion";

const areaColumns: ColumnConfig[] = [
  {
    key: "nombre_area",
    label: "Nombre del área",
    type: "text",
    placeholder: "Ej: Taller Mecánica, Express, Recepción",
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

  // Campos que vienen pre-llenados de la DB son de solo lectura
  const nombreReadOnly = Boolean(concesionario.nombre);
  const zonaReadOnly = Boolean(concesionario.zona);
  const estadoReadOnly = Boolean(concesionario.estado);
  const ciudadReadOnly = Boolean(concesionario.ciudad);
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
    // Validación de campos obligatorios antes de avanzar
    const errors: string[] = [];
    if (!nombre.trim()) errors.push("Nombre del concesionario");
    if (!estado.trim()) errors.push("Estado");
    if (numEmpleados === "" || Number(numEmpleados) <= 0)
      errors.push("N° de empleados");
    const areasValidas = areas.filter(
      (a) => String(a.nombre_area ?? "").trim().length > 0
    );
    if (areasValidas.length === 0) errors.push("Al menos un área");

    if (errors.length > 0) {
      alert(
        "Faltan campos obligatorios:\n\n• " + errors.join("\n• ")
      );
      return;
    }

    await saveToDb(formData);
    await markSectionComplete("seccion1");
    router.push("/formulario/2");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Save indicator (flotante) */}
      <SaveIndicator status={status} />

      {/* Basic info */}
      <div className="rounded-xl bg-card border border-border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombre" className="flex items-center gap-1">
              Nombre del concesionario *
              {nombreReadOnly && <Lock size={12} className="text-muted-foreground" />}
            </Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={readOnly}
              readOnly={nombreReadOnly}
              className={nombreReadOnly ? "opacity-70" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zona" className="flex items-center gap-1">
              Zona geográfica
              {zonaReadOnly && <Lock size={12} className="text-muted-foreground" />}
            </Label>
            <Input
              id="zona"
              value={zona}
              onChange={(e) => setZona(e.target.value)}
              placeholder="Ej: Central, Occidente, Oriente"
              disabled={readOnly}
              readOnly={zonaReadOnly}
              className={zonaReadOnly ? "opacity-70" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estado" className="flex items-center gap-1">
              Estado *
              {estadoReadOnly && <Lock size={12} className="text-muted-foreground" />}
            </Label>
            <Select
              value={estado || null}
              onValueChange={(v) => setEstado(v ?? "")}
              disabled={readOnly || estadoReadOnly}
            >
              <SelectTrigger className={`w-full ${estadoReadOnly ? "opacity-70" : ""}`}>
                <SelectValue placeholder="Seleccionar estado..." />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_VENEZUELA.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ciudad" className="flex items-center gap-1">
              Ciudad
              {ciudadReadOnly && <Lock size={12} className="text-muted-foreground" />}
            </Label>
            <Input
              id="ciudad"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Ej: Caracas, Valencia"
              disabled={readOnly}
              readOnly={ciudadReadOnly}
              className={ciudadReadOnly ? "opacity-70" : ""}
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
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <Button onClick={handleContinue} className="gap-2">
              Guardar y continuar
              <ArrowRight size={16} />
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
