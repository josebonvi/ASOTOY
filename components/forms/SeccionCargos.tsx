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
} from "lucide-react";

const CATEGORIAS = [
  { key: "tecnico", label: "Técnicos del taller", icon: Wrench, desc: "Mecánicos y técnicos certificados por Toyota" },
  { key: "supervision", label: "Supervisión y coordinación", icon: ShieldCheck, desc: "Jefes de taller, coordinadores, líderes" },
  { key: "atencion", label: "Atención al cliente", icon: Headphones, desc: "Asesores de servicio, recepción, citas" },
  { key: "soporte", label: "Soporte operativo", icon: Settings, desc: "Garantía, controlistas, almacén" },
  { key: "administrativo", label: "Administrativo", icon: Monitor, desc: "Soporte IT y administración del taller" },
] as const;

interface CargoEntry {
  cargoKey: string;
  nombre_cargo: string;
  nivel_toyota: string;
  nivel_interno: string;
  num_personas: number | null;
  certificado_toyota: boolean;
}

interface SeccionCargosProps {
  concesionarioId: string;
  cargos: Cargo[];
  areas: Area[];
  readOnly?: boolean;
}

export default function SeccionCargos({
  concesionarioId,
  cargos: initialCargos,
  readOnly,
}: SeccionCargosProps) {
  const router = useRouter();
  const supabase = createClient();
  const { markSectionComplete } = useFormProgress(concesionarioId);

  // Build initial state from DB data
  const buildInitialEntries = (): Record<string, CargoEntry> => {
    const entries: Record<string, CargoEntry> = {};
    for (const cargo of initialCargos) {
      // Try to match to a known cargo key
      const matched = CARGOS_MECANICA.find(
        (c) => c.value === cargo.nombre_cargo || c.label === cargo.nombre_cargo
      );
      const key = matched?.value ?? `custom_${cargo.id}`;
      entries[key] = {
        cargoKey: key,
        nombre_cargo: matched?.label ?? cargo.nombre_cargo,
        nivel_toyota: cargo.nivel_toyota ?? "",
        nivel_interno: cargo.nivel_interno ?? "",
        num_personas: cargo.num_personas,
        certificado_toyota: cargo.certificado_toyota,
      };
    }
    return entries;
  };

  const [selectedCargos, setSelectedCargos] = useState<Record<string, CargoEntry>>(buildInitialEntries);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>(() => {
    // Auto-expand categories that have selected cargos
    const expanded: Record<string, boolean> = {};
    for (const cat of CATEGORIAS) {
      const hasCargos = CARGOS_MECANICA
        .filter((c) => c.categoria === cat.key)
        .some((c) => selectedCargos[c.value]);
      expanded[cat.key] = hasCargos;
    }
    // Always expand tecnico by default
    expanded.tecnico = true;
    return expanded;
  });

  const [motivoRotacion, setMotivoRotacion] = useState(
    initialCargos.find((c) => c.motivo_rotacion)?.motivo_rotacion ?? ""
  );

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
          nivel_toyota: "",
          nivel_interno: "",
          num_personas: null,
          certificado_toyota: false,
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

  const formData = { selectedCargos, motivoRotacion };

  const saveToDb = useCallback(
    async (data: typeof formData) => {
      await supabase
        .from("cargos")
        .delete()
        .eq("concesionario_id", concesionarioId);

      const entries = Object.values(data.selectedCargos);
      if (entries.length > 0) {
        await supabase.from("cargos").insert(
          entries.map((c) => ({
            concesionario_id: concesionarioId,
            nombre_cargo: c.nombre_cargo,
            area: "Taller Mecánico",
            nivel_toyota: c.nivel_toyota || null,
            nivel_interno: c.nivel_interno || null,
            num_personas: c.num_personas,
            certificado_toyota: c.certificado_toyota,
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

  const totalPersonas = Object.values(selectedCargos).reduce(
    (sum, c) => sum + (c.num_personas ?? 0),
    0
  );
  const totalCargos = Object.keys(selectedCargos).length;

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
                              <select
                                value={entry.nivel_toyota}
                                onChange={(e) =>
                                  updateCargo(
                                    cargo.value,
                                    "nivel_toyota",
                                    e.target.value
                                  )
                                }
                                disabled={readOnly}
                                title="Nivel Toyota"
                                aria-label={`Nivel Toyota para ${cargo.label}`}
                                className="w-full h-9 bg-input border border-border rounded-md px-2 text-sm text-foreground"
                              >
                                <option value="">Seleccionar...</option>
                                {NIVELES_TOYOTA.map((n) => (
                                  <option key={n.value} value={n.value}>
                                    {n.label}
                                  </option>
                                ))}
                              </select>
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
