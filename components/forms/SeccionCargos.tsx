"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useFormProgress } from "@/hooks/useFormProgress";
import { NIVELES_TOYOTA, CARGOS_MECANICA } from "@/lib/constants";
import type { Cargo, Area } from "@/lib/types";
import { SaveIndicator } from "@/components/shared/SaveIndicator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Wrench,
  ShieldCheck,
  Headphones,
  Settings,
  Monitor,
  ChevronDown,
  ChevronUp,
  Users,
  Plus,
  Trash2,
  FileCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { key: "tecnico", label: "Técnicos del taller", icon: Wrench, desc: "Mecánicos y técnicos certificados por Toyota" },
  { key: "supervision", label: "Supervisión y coordinación", icon: ShieldCheck, desc: "Jefes de taller, coordinadores, líderes" },
  { key: "atencion", label: "Atención al cliente", icon: Headphones, desc: "Asesores de servicio, recepción, citas" },
  { key: "soporte", label: "Soporte operativo", icon: Settings, desc: "Garantía, controlistas, almacén" },
  { key: "administrativo", label: "Administrativo", icon: Monitor, desc: "Soporte IT y administración del taller" },
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────

interface CargoEntry {
  cargoKey: string;
  nombre_cargo: string;
  nombre_cargo_dealer: string;
  nivel_toyota: string;
  nivel_interno: string;
  num_personas: number | null;
  certificado_toyota: boolean;
  pre_populated: boolean;
}

interface SeccionCargosProps {
  concesionarioId: string;
  cargos: Cargo[];
  areas: Area[];
  organigramaAprobado?: boolean;
  readOnly?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SeccionCargos({
  concesionarioId,
  cargos: initialCargos,
  organigramaAprobado = false,
  readOnly,
}: SeccionCargosProps) {
  const router = useRouter();
  const supabase = createClient();
  const { markSectionComplete } = useFormProgress(concesionarioId);

  // Detect if we have pre-populated cargos from organigrama
  const hasPrePopulated = initialCargos.some((c) => c.pre_populated);
  const usePrePopulatedMode = organigramaAprobado && hasPrePopulated;

  // ── Build initial state ────────────────────────────────────────────────

  const buildInitialEntries = (): CargoEntry[] => {
    if (usePrePopulatedMode) {
      // Pre-populated mode: use cargos from organigrama mapping
      return initialCargos.map((cargo, i) => ({
        cargoKey: cargo.id ?? `pre_${i}`,
        nombre_cargo: cargo.nombre_cargo,
        nombre_cargo_dealer: cargo.nombre_cargo_dealer ?? cargo.nombre_cargo,
        nivel_toyota: cargo.nivel_toyota ?? "",
        nivel_interno: cargo.nivel_interno ?? "",
        num_personas: cargo.num_personas,
        certificado_toyota: cargo.certificado_toyota,
        pre_populated: cargo.pre_populated ?? false,
      }));
    }

    // Fallback mode: build from CARGOS_MECANICA checklist
    return initialCargos.map((cargo, i) => {
      const matched = CARGOS_MECANICA.find(
        (c) => c.value === cargo.nombre_cargo || c.label === cargo.nombre_cargo
      );
      return {
        cargoKey: matched?.value ?? `custom_${cargo.id ?? i}`,
        nombre_cargo: matched?.label ?? cargo.nombre_cargo,
        nombre_cargo_dealer: cargo.nombre_cargo_dealer ?? "",
        nivel_toyota: cargo.nivel_toyota ?? "",
        nivel_interno: cargo.nivel_interno ?? "",
        num_personas: cargo.num_personas,
        certificado_toyota: cargo.certificado_toyota,
        pre_populated: false,
      };
    });
  };

  // ── State ──────────────────────────────────────────────────────────────

  // Pre-populated mode uses an array (ordered list of cargos)
  const [prePopCargos, setPrePopCargos] = useState<CargoEntry[]>(
    usePrePopulatedMode ? buildInitialEntries() : []
  );

  // Fallback mode uses a record (keyed by cargo value from CARGOS_MECANICA)
  const [selectedCargos, setSelectedCargos] = useState<Record<string, CargoEntry>>(() => {
    if (usePrePopulatedMode) return {};
    const entries: Record<string, CargoEntry> = {};
    for (const entry of buildInitialEntries()) {
      entries[entry.cargoKey] = entry;
    }
    return entries;
  });

  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>(() => {
    if (usePrePopulatedMode) return {};
    const expanded: Record<string, boolean> = {};
    for (const cat of CATEGORIAS) {
      const hasCargos = CARGOS_MECANICA
        .filter((c) => c.categoria === cat.key)
        .some((c) => selectedCargos[c.value]);
      expanded[cat.key] = hasCargos;
    }
    expanded.tecnico = true;
    return expanded;
  });

  const [motivoRotacion, setMotivoRotacion] = useState(
    initialCargos.find((c) => c.motivo_rotacion)?.motivo_rotacion ?? ""
  );

  // ── Pre-populated mode actions ─────────────────────────────────────────

  function addPrePopCargo() {
    setPrePopCargos((prev) => [
      ...prev,
      {
        cargoKey: `new_${Date.now()}`,
        nombre_cargo: "",
        nombre_cargo_dealer: "",
        nivel_toyota: "",
        nivel_interno: "",
        num_personas: 1,
        certificado_toyota: false,
        pre_populated: false,
      },
    ]);
  }

  function updatePrePopCargo(index: number, field: keyof CargoEntry, value: unknown) {
    setPrePopCargos((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  }

  function removePrePopCargo(index: number) {
    setPrePopCargos((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Fallback mode actions ──────────────────────────────────────────────

  function toggleCargo(cargoKey: string, cargoLabel: string) {
    setSelectedCargos((prev) => {
      if (prev[cargoKey]) {
        const next = { ...prev };
        delete next[cargoKey];
        return next;
      }
      return {
        ...prev,
        [cargoKey]: {
          cargoKey,
          nombre_cargo: cargoLabel,
          nombre_cargo_dealer: "",
          nivel_toyota: "",
          nivel_interno: "",
          num_personas: null,
          certificado_toyota: false,
          pre_populated: false,
        },
      };
    });
  }

  function updateCargo(cargoKey: string, field: keyof CargoEntry, value: unknown) {
    setSelectedCargos((prev) => ({
      ...prev,
      [cargoKey]: { ...prev[cargoKey], [field]: value },
    }));
  }

  // ── Stats ──────────────────────────────────────────────────────────────

  const activeCargos = usePrePopulatedMode
    ? prePopCargos
    : Object.values(selectedCargos);

  const totalPersonas = activeCargos.reduce(
    (sum, c) => sum + (c.num_personas ?? 0),
    0
  );
  const totalCargos = activeCargos.length;

  // ── Save ───────────────────────────────────────────────────────────────

  const formData = usePrePopulatedMode
    ? { cargos: prePopCargos, motivoRotacion }
    : { cargos: Object.values(selectedCargos), motivoRotacion };

  const saveToDb = useCallback(
    async (data: { cargos: CargoEntry[]; motivoRotacion: string }) => {
      await supabase
        .from("cargos")
        .delete()
        .eq("concesionario_id", concesionarioId);

      if (data.cargos.length > 0) {
        await supabase.from("cargos").insert(
          data.cargos.map((c) => ({
            concesionario_id: concesionarioId,
            nombre_cargo: c.nombre_cargo,
            nombre_cargo_dealer: c.nombre_cargo_dealer || null,
            area: "Taller Mecánico",
            nivel_toyota: c.nivel_toyota || null,
            nivel_interno: c.nivel_interno || null,
            num_personas: c.num_personas,
            certificado_toyota: c.certificado_toyota,
            motivo_rotacion: data.motivoRotacion || null,
            pre_populated: c.pre_populated,
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

  // ─── Render: Pre-populated mode ────────────────────────────────────────

  if (usePrePopulatedMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Users size={16} />
            <span>
              <strong className="text-foreground">{totalCargos}</strong> cargos
              {totalPersonas > 0 && (
                <>
                  {" · "}
                  <strong className="text-foreground">{totalPersonas}</strong>{" "}
                  personas
                </>
              )}
            </span>
          </div>
          <SaveIndicator status={status} />
        </div>

        {/* Pre-populated banner */}
        <div className="rounded-lg bg-success/5 border border-success/20 px-4 py-3 text-sm flex items-start gap-3">
          <FileCheck size={18} className="text-success shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">
              Cargos identificados de su organigrama
            </p>
            <p className="text-muted-foreground mt-0.5">
              Estos cargos fueron pre-llenados desde su organigrama aprobado.
              Puede editarlos, eliminarlos, o agregar nuevos según sea necesario.
            </p>
          </div>
        </div>

        {/* Pre-populated cargo list */}
        <div className="space-y-3">
          <AnimatePresence>
            {prePopCargos.map((cargo, index) => (
              <motion.div
                key={cargo.cargoKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl bg-card border border-border p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Input
                        value={cargo.nombre_cargo}
                        onChange={(e) =>
                          updatePrePopCargo(index, "nombre_cargo", e.target.value)
                        }
                        placeholder="Nombre del cargo estándar..."
                        disabled={readOnly}
                        className="h-8 text-sm font-medium"
                      />
                    </div>
                    {cargo.nombre_cargo_dealer && cargo.nombre_cargo_dealer !== cargo.nombre_cargo && (
                      <p className="text-xs text-muted-foreground ml-1">
                        Nombre interno: {cargo.nombre_cargo_dealer}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {cargo.pre_populated && (
                      <Badge variant="outline" className="text-xs text-success border-success/30">
                        Organigrama
                      </Badge>
                    )}
                    {!readOnly && (
                      <button
                        type="button"
                        title="Eliminar cargo"
                        onClick={() => removePrePopCargo(index)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      N° personas
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={cargo.num_personas ?? ""}
                      onChange={(e) =>
                        updatePrePopCargo(
                          index,
                          "num_personas",
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                      placeholder="0"
                      disabled={readOnly}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Nivel Toyota
                    </label>
                    <Select
                      value={cargo.nivel_toyota || undefined}
                      onValueChange={(v) =>
                        updatePrePopCargo(index, "nivel_toyota", v ?? "")
                      }
                      disabled={readOnly}
                    >
                      <SelectTrigger className="w-full h-9">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {NIVELES_TOYOTA.map((n) => (
                          <SelectItem key={n.value} value={n.value}>
                            {n.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Nombre interno
                    </label>
                    <Input
                      value={cargo.nivel_interno}
                      onChange={(e) =>
                        updatePrePopCargo(index, "nivel_interno", e.target.value)
                      }
                      placeholder="Ej: G2, Senior"
                      disabled={readOnly}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Cert. Toyota
                    </label>
                    <div className="flex items-center h-9">
                      <Switch
                        checked={cargo.certificado_toyota}
                        onCheckedChange={(v) =>
                          updatePrePopCargo(index, "certificado_toyota", v)
                        }
                        disabled={readOnly}
                      />
                      <span className="ml-2 text-xs text-muted-foreground">
                        {cargo.certificado_toyota ? "Sí" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add cargo button */}
          {!readOnly && (
            <button
              onClick={addPrePopCargo}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-border/50 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Plus size={16} />
              Agregar cargo
            </button>
          )}
        </div>

        {/* Rotation */}
        <div className="rounded-xl bg-card border border-border p-4 sm:p-6 space-y-4">
          <div className="space-y-2">
            <Label>Motivo principal de rotación de personal en el taller</Label>
            <Textarea
              value={motivoRotacion}
              onChange={(e) => setMotivoRotacion(e.target.value)}
              placeholder="¿Por qué renuncian o son despedidos los técnicos y personal del taller con más frecuencia?"
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

  // ─── Render: Fallback mode (original checklist) ────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Users size={16} />
          <span>
            <strong className="text-foreground">{totalCargos}</strong> cargos
            seleccionados
            {totalPersonas > 0 && (
              <>
                {" · "}
                <strong className="text-foreground">{totalPersonas}</strong>{" "}
                personas
              </>
            )}
          </span>
        </div>
        <SaveIndicator status={status} />
      </div>

      {/* Notice */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-muted-foreground">
        Marque los cargos que existen en su departamento de mecánica/servicio.
        Para cada cargo seleccionado, indique cuántas personas lo ocupan y su
        nivel Toyota.
      </div>

      {/* Categories */}
      {CATEGORIAS.map((cat) => {
        const cargosInCat = CARGOS_MECANICA.filter(
          (c) => c.categoria === cat.key
        );
        const selectedInCat = cargosInCat.filter(
          (c) => selectedCargos[c.value]
        ).length;
        const isExpanded = expandedCats[cat.key] ?? false;
        const Icon = cat.icon;

        return (
          <div
            key={cat.key}
            className="rounded-xl bg-card border border-border overflow-hidden"
          >
            {/* Category header */}
            <button
              type="button"
              onClick={() =>
                setExpandedCats((prev) => ({
                  ...prev,
                  [cat.key]: !prev[cat.key],
                }))
              }
              className="w-full flex items-center gap-3 p-4 sm:p-5 text-left hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0">
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{cat.label}</p>
                <p className="text-xs text-muted-foreground">{cat.desc}</p>
              </div>
              {selectedInCat > 0 && (
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full shrink-0">
                  {selectedInCat}
                </span>
              )}
              {isExpanded ? (
                <ChevronUp size={16} className="text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown size={16} className="text-muted-foreground shrink-0" />
              )}
            </button>

            {/* Cargo list */}
            {isExpanded && (
              <div className="border-t border-border">
                {cargosInCat.map((cargo) => {
                  const isSelected = !!selectedCargos[cargo.value];
                  const entry = selectedCargos[cargo.value];

                  return (
                    <div
                      key={cargo.value}
                      className={`border-b border-border last:border-0 transition-colors ${
                        isSelected ? "bg-primary/[0.03]" : ""
                      }`}
                    >
                      {/* Cargo toggle row */}
                      <div className="flex items-center gap-3 px-4 sm:px-5 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            toggleCargo(cargo.value, cargo.label)
                          }
                          disabled={readOnly}
                          title={`Seleccionar ${cargo.label}`}
                          aria-label={`Seleccionar ${cargo.label}`}
                          className="h-4 w-4 rounded border-border accent-primary shrink-0"
                        />
                        <span
                          className={`text-sm flex-1 ${
                            isSelected
                              ? "font-medium text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {cargo.label}
                        </span>
                      </div>

                      {/* Expanded details for selected cargo */}
                      {isSelected && entry && (
                        <div className="px-4 sm:px-5 pb-4 pt-1 ml-7">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">
                                N° personas
                              </label>
                              <Input
                                type="number"
                                min={0}
                                value={entry.num_personas ?? ""}
                                onChange={(e) =>
                                  updateCargo(
                                    cargo.value,
                                    "num_personas",
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value)
                                  )
                                }
                                placeholder="0"
                                disabled={readOnly}
                                className="h-9"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">
                                Nivel Toyota
                              </label>
                              <Select
                                value={entry.nivel_toyota || undefined}
                                onValueChange={(v) =>
                                  updateCargo(
                                    cargo.value,
                                    "nivel_toyota",
                                    v ?? ""
                                  )
                                }
                                disabled={readOnly}
                              >
                                <SelectTrigger className="w-full h-9">
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {NIVELES_TOYOTA.map((n) => (
                                    <SelectItem key={n.value} value={n.value}>
                                      {n.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">
                                Nombre interno
                              </label>
                              <Input
                                value={entry.nivel_interno}
                                onChange={(e) =>
                                  updateCargo(
                                    cargo.value,
                                    "nivel_interno",
                                    e.target.value
                                  )
                                }
                                placeholder="Ej: G2, Senior"
                                disabled={readOnly}
                                className="h-9"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">
                                Cert. Toyota
                              </label>
                              <div className="flex items-center h-9">
                                <Switch
                                  checked={entry.certificado_toyota}
                                  onCheckedChange={(v) =>
                                    updateCargo(
                                      cargo.value,
                                      "certificado_toyota",
                                      v
                                    )
                                  }
                                  disabled={readOnly}
                                />
                                <span className="ml-2 text-xs text-muted-foreground">
                                  {entry.certificado_toyota ? "Sí" : "No"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Rotation */}
      <div className="rounded-xl bg-card border border-border p-4 sm:p-6 space-y-4">
        <div className="space-y-2">
          <Label>Motivo principal de rotación de personal en el taller</Label>
          <Textarea
            value={motivoRotacion}
            onChange={(e) => setMotivoRotacion(e.target.value)}
            placeholder="¿Por qué renuncian o son despedidos los técnicos y personal del taller con más frecuencia?"
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
