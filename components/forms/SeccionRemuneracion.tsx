"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useFormProgress } from "@/hooks/useFormProgress";
import { MONEDAS, TIPOS_PAGO, FRECUENCIA_REVISION } from "@/lib/constants";
import type { Cargo } from "@/lib/types";
import { DynamicTable, type ColumnConfig } from "@/components/forms/DynamicTable";
import { SaveIndicator } from "@/components/shared/SaveIndicator";
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
import { ArrowRight, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const rangoColumns: ColumnConfig[] = [
  { key: "cargo_nombre", label: "Cargo", type: "text", readOnly: true },
  {
    key: "salario_min",
    label: "Salario mín.",
    type: "number",
    placeholder: "Ej: 400",
    width: "120px",
  },
  {
    key: "salario_max",
    label: "Salario máx.",
    type: "number",
    placeholder: "Ej: 800",
    width: "120px",
  },
  {
    key: "tipo_pago",
    label: "Tipo pago",
    type: "select",
    options: [...TIPOS_PAGO],
  },
  {
    key: "moneda",
    label: "Moneda",
    type: "select",
    options: [...MONEDAS],
  },
];

interface SeccionRemuneracionProps {
  concesionarioId: string;
  cargos: Cargo[];
  soloMecanica?: boolean;
  readOnly?: boolean;
}

export default function SeccionRemuneracion({
  concesionarioId,
  cargos,
  soloMecanica = false,
  readOnly,
}: SeccionRemuneracionProps) {
  const router = useRouter();
  const supabase = createClient();
  const { markSectionComplete } = useFormProgress(concesionarioId);

  // Pre-fill from cargos
  const [rangos, setRangos] = useState<Record<string, unknown>[]>([]);
  const [monedaPrincipal, setMonedaPrincipal] = useState("USD");
  const [tieneComisiones, setTieneComisiones] = useState(false);
  const [descripcionComisiones, setDescripcionComisiones] = useState("");
  const [tieneBonos, setTieneBonos] = useState(false);
  const [descripcionBonos, setDescripcionBonos] = useState("");
  const [frecuenciaRevision, setFrecuenciaRevision] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Load existing data
  useEffect(() => {
    async function loadData() {
      // Use cargos as-is (server already filtered if soloMecanica)
      const tallerCargos = cargos;

      const { data: existingRangos } = await supabase
        .from("rangos_salariales")
        .select("*")
        .eq("concesionario_id", concesionarioId);

      if (existingRangos && existingRangos.length > 0) {
        setRangos(
          tallerCargos.map((cargo) => {
            const existing = existingRangos.find(
              (r) => r.cargo_id === cargo.id
            );
            return {
              cargo_id: cargo.id,
              cargo_nombre: cargo.nombre_cargo_dealer
                ? `${cargo.nombre_cargo} (${cargo.nombre_cargo_dealer})`
                : cargo.nombre_cargo,
              salario_min: existing?.salario_min ?? null,
              salario_max: existing?.salario_max ?? null,
              tipo_pago: existing?.tipo_pago ?? "",
              moneda: existing?.moneda ?? "USD",
            };
          })
        );
        // Load global fields from first record
        const first = existingRangos[0];
        if (first.tiene_comisiones) setTieneComisiones(true);
        if (first.descripcion_comisiones)
          setDescripcionComisiones(first.descripcion_comisiones);
        if (first.tiene_bonos) setTieneBonos(true);
        if (first.descripcion_bonos)
          setDescripcionBonos(first.descripcion_bonos);
        if (first.frecuencia_revision)
          setFrecuenciaRevision(first.frecuencia_revision);
      } else {
        // Pre-fill from cargos
        setRangos(
          tallerCargos.map((cargo) => ({
            cargo_id: cargo.id,
            cargo_nombre: cargo.nombre_cargo,
            salario_min: null,
            salario_max: null,
            tipo_pago: "",
            moneda: "USD",
          }))
        );
      }
      setLoaded(true);
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formData = {
    rangos,
    monedaPrincipal,
    tieneComisiones,
    descripcionComisiones,
    tieneBonos,
    descripcionBonos,
    frecuenciaRevision,
  };

  const saveToDb = useCallback(
    async (data: typeof formData) => {
      // Delete and re-insert
      await supabase
        .from("rangos_salariales")
        .delete()
        .eq("concesionario_id", concesionarioId);

      const validRangos = data.rangos.filter((r) => r.cargo_id);
      if (validRangos.length > 0) {
        await supabase.from("rangos_salariales").insert(
          validRangos.map((r) => ({
            concesionario_id: concesionarioId,
            cargo_id: r.cargo_id as string,
            moneda: (r.moneda as string) || data.monedaPrincipal,
            salario_min: r.salario_min as number | null,
            salario_max: r.salario_max as number | null,
            tipo_pago: (r.tipo_pago as string) || null,
            tiene_comisiones: data.tieneComisiones,
            descripcion_comisiones: data.descripcionComisiones || null,
            tiene_bonos: data.tieneBonos,
            descripcion_bonos: data.descripcionBonos || null,
            frecuencia_revision: data.frecuenciaRevision || null,
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
    await markSectionComplete("seccion3");
    router.push("/formulario/4");
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
          Complete primero la Sección 2 para definir los cargos del
          concesionario.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <SaveIndicator status={status} />
      </div>

      {/* Notice */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-muted-foreground">
        No pedimos cuánto gana ninguna persona. Solo el rango salarial (mínimo
        - máximo) por nivel de cargo.
      </div>

      {/* Currency */}
      <div className="rounded-xl bg-card border border-border p-6">
        <div className="space-y-2">
          <Label>Moneda principal de pago</Label>
          <Select
            value={monedaPrincipal}
            onValueChange={(v) => setMonedaPrincipal(v ?? "USD")}
            disabled={readOnly}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Seleccionar moneda..." />
            </SelectTrigger>
            <SelectContent>
              {MONEDAS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Salary ranges table */}
      <div className="rounded-xl bg-card border border-border p-6">
        <h3 className="text-sm font-semibold mb-1">
          Rangos salariales por cargo
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Los cargos se pre-llenaron de la Sección 2. Indique el rango salarial
          para cada uno.
        </p>
        <DynamicTable
          columns={rangoColumns}
          data={rangos}
          onChange={setRangos}
          minRows={rangos.length}
        />
      </div>

      {/* Commissions & bonuses */}
      <div className="rounded-xl bg-card border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Label>¿Tienen comisiones o incentivos para el personal del taller?</Label>
          <Switch
            checked={tieneComisiones}
            onCheckedChange={setTieneComisiones}
            disabled={readOnly}
          />
        </div>
        {tieneComisiones && (
          <Textarea
            value={descripcionComisiones}
            onChange={(e) => setDescripcionComisiones(e.target.value)}
            placeholder="Describa el esquema de comisiones..."
            rows={2}
            disabled={readOnly}
          />
        )}

        <div className="flex items-center justify-between">
          <Label>¿Tienen bonos por desempeño?</Label>
          <Switch
            checked={tieneBonos}
            onCheckedChange={setTieneBonos}
            disabled={readOnly}
          />
        </div>
        {tieneBonos && (
          <Textarea
            value={descripcionBonos}
            onChange={(e) => setDescripcionBonos(e.target.value)}
            placeholder="Describa el esquema de bonos..."
            rows={2}
            disabled={readOnly}
          />
        )}
      </div>

      {/* Revision frequency */}
      <div className="rounded-xl bg-card border border-border p-6">
        <div className="space-y-2">
          <Label>Frecuencia de revisión salarial</Label>
          <Select
            value={frecuenciaRevision || null}
            onValueChange={(v) => setFrecuenciaRevision(v ?? "")}
            disabled={readOnly}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {FRECUENCIA_REVISION.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
