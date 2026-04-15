"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { suggestAllMappings } from "@/lib/fuzzyMatch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import OrganigramaVisualization from "@/components/organigrama/OrganigramaVisualization";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Wand2,
  CheckCheck,
  ShieldCheck,
  FileText,
  Users,
  Loader2,
  MessageSquare,
  Save,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Concesionario {
  id: string;
  nombre: string;
  zona: string | null;
  estado: string | null;
}

interface Organigrama {
  id: string;
  concesionario_id: string;
  tipo: string;
  estado: string;
  archivo_url: string | null;
  archivo_nombre: string | null;
  notas_concesionario: string | null;
  notas_admin: string | null;
  created_at: string;
  concesionario: Concesionario | null;
}

interface OrgCargo {
  id: string;
  organigrama_id: string;
  concesionario_id: string;
  nombre_cargo_dealer: string;
  departamento: string;
  num_personas: number;
  orden: number;
}

interface CatalogoEntry {
  id: string;
  value: string;
  label: string;
  categoria: string;
  nivel_toyota_default: string | null;
  orden: number;
  activo: boolean;
}

interface ExistingMapping {
  id: string;
  organigrama_cargo_id: string;
  catalogo_toyota_id: string | null;
  nombre_cargo_estandar: string | null;
  nivel_toyota_sugerido: string | null;
  confianza_match: number | null;
  es_auto_match: boolean;
  confirmado_por_admin: boolean;
  catalogo: CatalogoEntry | null;
}

interface MappingState {
  catalogoToyotaId: string;
  nombreCargoEstandar: string;
  nivelToyota: string;
  confianza: number | null;
  esAutoMatch: boolean;
  confirmado: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const NIVELES = [
  { value: "ayudante", label: "Ayudante / Pasante" },
  { value: "tecnico_g1", label: "Tecnico Toyota / G1" },
  { value: "tecnico_g2", label: "Tecnico Profesional / G2" },
  { value: "tecnico_g3", label: "Tecnico Diagnostico / G3" },
  { value: "tecnico_g4", label: "Tecnico Maestro / G4" },
  { value: "no_aplica", label: "No aplica" },
];

const ESTADO_CONFIG: Record<string, { label: string; className: string }> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  },
  en_revision: {
    label: "En revision",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  aprobado: {
    label: "Aprobado",
    className: "bg-green-500/15 text-green-400 border-green-500/30",
  },
  rechazado: {
    label: "Rechazado",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function OrganigramaProcessingClient({
  organigrama,
  orgCargos,
  existingMappings,
  catalogo,
}: {
  organigrama: Organigrama;
  orgCargos: OrgCargo[];
  existingMappings: ExistingMapping[];
  catalogo: CatalogoEntry[];
}) {
  const router = useRouter();
  const supabase = createClient();

  // Build initial mappings state from existing data
  const initialMappings = useMemo(() => {
    const map: Record<string, MappingState> = {};
    for (const cargo of orgCargos) {
      const existing = existingMappings.find(
        (m) => m.organigrama_cargo_id === cargo.id
      );
      if (existing) {
        map[cargo.id] = {
          catalogoToyotaId: existing.catalogo_toyota_id ?? "",
          nombreCargoEstandar:
            existing.nombre_cargo_estandar ??
            existing.catalogo?.label ??
            "",
          nivelToyota: existing.nivel_toyota_sugerido ?? "no_aplica",
          confianza: existing.confianza_match,
          esAutoMatch: existing.es_auto_match,
          confirmado: existing.confirmado_por_admin,
        };
      } else {
        map[cargo.id] = {
          catalogoToyotaId: "",
          nombreCargoEstandar: "",
          nivelToyota: "no_aplica",
          confianza: null,
          esAutoMatch: false,
          confirmado: false,
        };
      }
    }
    return map;
  }, [orgCargos, existingMappings]);

  const [mappings, setMappings] =
    useState<Record<string, MappingState>>(initialMappings);
  const [notasAdmin, setNotasAdmin] = useState(
    organigrama.notas_admin ?? ""
  );
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Group catalogo by categoria for the select dropdowns
  const catalogoByCategoria = useMemo(() => {
    const groups: Record<string, CatalogoEntry[]> = {};
    for (const entry of catalogo) {
      const cat = entry.categoria || "Otros";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(entry);
    }
    return groups;
  }, [catalogo]);

  // Check if all cargos have confirmed mappings.
  // Guard: organigrama vacío nunca debe considerarse "confirmado" — .every() sobre array vacío
  // retorna true, lo que permitiría aprobar un organigrama sin cargos y borrar toda la data del concesionario.
  const allConfirmed = useMemo(() => {
    return (
      orgCargos.length > 0 &&
      orgCargos.every(
        (c) =>
          mappings[c.id]?.confirmado && mappings[c.id]?.catalogoToyotaId !== ""
      )
    );
  }, [orgCargos, mappings]);

  // ── Handlers ────────────────────────────────────────────────────────────

  function updateMapping(
    cargoId: string,
    updates: Partial<MappingState>
  ) {
    setMappings((prev) => ({
      ...prev,
      [cargoId]: { ...prev[cargoId], ...updates },
    }));
  }

  function handleCatalogoChange(cargoId: string, catalogoId: string) {
    const entry = catalogo.find((c) => c.id === catalogoId);
    updateMapping(cargoId, {
      catalogoToyotaId: catalogoId,
      nombreCargoEstandar: entry?.label ?? "",
      nivelToyota: entry?.nivel_toyota_default ?? "no_aplica",
    });
  }

  // Auto-suggest using fuzzy matching
  async function handleAutoSuggest() {
    setIsSuggesting(true);
    try {
      const dealerCargos = orgCargos.map((c) => ({
        id: c.id,
        nombre: c.nombre_cargo_dealer,
      }));
      const catalogoForMatch = catalogo.map((c) => ({
        value: c.value,
        label: c.label,
      }));

      const suggestions = suggestAllMappings(dealerCargos, catalogoForMatch);

      const newMappings = { ...mappings };
      let matchCount = 0;

      for (const [cargoId, match] of suggestions) {
        if (match) {
          const catalogoEntry = catalogo.find(
            (c) => c.value === match.catalogoValue
          );
          if (catalogoEntry) {
            newMappings[cargoId] = {
              catalogoToyotaId: catalogoEntry.id,
              nombreCargoEstandar: match.catalogoLabel,
              nivelToyota:
                catalogoEntry.nivel_toyota_default ?? "no_aplica",
              confianza: match.confidence,
              esAutoMatch: true,
              confirmado: false,
            };
            matchCount++;
          }
        }
      }

      setMappings(newMappings);

      // Upsert to DB
      const upsertRows = orgCargos
        .filter((c) => newMappings[c.id]?.catalogoToyotaId)
        .map((c) => {
          const m = newMappings[c.id];
          return {
            organigrama_cargo_id: c.id,
            catalogo_toyota_id: m.catalogoToyotaId,
            nombre_cargo_estandar: m.nombreCargoEstandar,
            nivel_toyota_sugerido: m.nivelToyota,
            confianza_match: m.confianza,
            es_auto_match: m.esAutoMatch,
            confirmado_por_admin: m.confirmado,
          };
        });

      if (upsertRows.length > 0) {
        const { error } = await supabase
          .from("organigrama_mappings")
          .upsert(upsertRows, {
            onConflict: "organigrama_cargo_id",
          });
        if (error) throw error;
      }

      // Update organigrama estado to en_revision if still pendiente
      if (organigrama.estado === "pendiente") {
        await supabase
          .from("organigramas")
          .update({ estado: "en_revision" })
          .eq("id", organigrama.id);
      }

      toast.success(
        `Auto-sugerencias completadas: ${matchCount} de ${orgCargos.length} cargos mapeados`
      );
    } catch (err) {
      console.error(err);
      toast.error("Error al generar auto-sugerencias");
    } finally {
      setIsSuggesting(false);
    }
  }

  // Save current mapping state to DB
  async function handleSaveMappings() {
    setIsSaving(true);
    try {
      const upsertRows = orgCargos
        .filter((c) => mappings[c.id]?.catalogoToyotaId)
        .map((c) => {
          const m = mappings[c.id];
          return {
            organigrama_cargo_id: c.id,
            catalogo_toyota_id: m.catalogoToyotaId,
            nombre_cargo_estandar: m.nombreCargoEstandar,
            nivel_toyota_sugerido: m.nivelToyota,
            confianza_match: m.confianza,
            es_auto_match: m.esAutoMatch,
            confirmado_por_admin: m.confirmado,
          };
        });

      if (upsertRows.length > 0) {
        const { error } = await supabase
          .from("organigrama_mappings")
          .upsert(upsertRows, { onConflict: "organigrama_cargo_id" });
        if (error) throw error;
      }

      // Save admin notes
      if (notasAdmin !== organigrama.notas_admin) {
        await supabase
          .from("organigramas")
          .update({ notas_admin: notasAdmin })
          .eq("id", organigrama.id);
      }

      toast.success("Mapeos guardados correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar mapeos");
    } finally {
      setIsSaving(false);
    }
  }

  // Confirm all mappings
  function handleConfirmAll() {
    const newMappings = { ...mappings };
    for (const cargo of orgCargos) {
      if (newMappings[cargo.id]?.catalogoToyotaId) {
        newMappings[cargo.id] = {
          ...newMappings[cargo.id],
          confirmado: true,
        };
      }
    }
    setMappings(newMappings);
    toast.success("Todos los mapeos marcados como confirmados");
  }

  // Approve organigrama — the critical action
  async function handleApprove() {
    if (!allConfirmed) return;
    setIsApproving(true);

    try {
      const concesionarioId = organigrama.concesionario_id;

      // a. Update organigrama estado
      const { error: orgError } = await supabase
        .from("organigramas")
        .update({
          estado: "aprobado",
          aprobado_at: new Date().toISOString(),
          notas_admin: notasAdmin,
        })
        .eq("id", organigrama.id);
      if (orgError) throw orgError;

      // b. Update concesionario organigrama_estado
      const { error: concError } = await supabase
        .from("concesionarios")
        .update({ organigrama_estado: "aprobado" })
        .eq("id", concesionarioId);
      if (concError) throw concError;

      // c. Delete existing cargos for this concesionario (clean slate)
      const { error: delError } = await supabase
        .from("cargos")
        .delete()
        .eq("concesionario_id", concesionarioId);
      if (delError) throw delError;

      // d. Insert new cargos from confirmed mappings (include unmapped cargos too)
      const newCargos = orgCargos
        .filter((c) => mappings[c.id]?.confirmado)
        .map((c) => {
          const m = mappings[c.id];
          return {
            concesionario_id: concesionarioId,
            nombre_cargo: m.nombreCargoEstandar || c.nombre_cargo_dealer,
            nombre_cargo_dealer: c.nombre_cargo_dealer,
            area: c.departamento || "Taller Mecánico",
            nivel_toyota: m.nivelToyota || "no_aplica",
            num_personas: c.num_personas,
            organigrama_cargo_id: c.id,
            pre_populated: true,
            certificado_toyota: false,
          };
        });

      if (newCargos.length > 0) {
        const { error: insertError } = await supabase
          .from("cargos")
          .insert(newCargos);
        if (insertError) throw insertError;
      }

      // d2. Pre-fill Sección 1: áreas y num_empleados desde organigrama
      const deptoMap = new Map<string, number>();
      for (const c of orgCargos) {
        const dept = c.departamento || "Taller Mecánico";
        deptoMap.set(dept, (deptoMap.get(dept) || 0) + c.num_personas);
      }
      const totalEmpleados = orgCargos.reduce((s, c) => s + c.num_personas, 0);

      // Delete existing areas and insert from organigrama
      await supabase.from("areas").delete().eq("concesionario_id", concesionarioId);
      const newAreas = Array.from(deptoMap.entries()).map(([nombre, personas]) => ({
        concesionario_id: concesionarioId,
        nombre_area: nombre,
        num_personas: personas,
      }));
      if (newAreas.length > 0) {
        await supabase.from("areas").insert(newAreas);
      }

      // Update concesionario with employee count and organigrama flag
      await supabase
        .from("concesionarios")
        .update({
          num_empleados: totalEmpleados,
          tiene_organigrama: true,
        })
        .eq("id", concesionarioId);

      // e. Save all mappings as confirmed
      const finalMappings = orgCargos
        .filter((c) => mappings[c.id]?.catalogoToyotaId)
        .map((c) => {
          const m = mappings[c.id];
          return {
            organigrama_cargo_id: c.id,
            catalogo_toyota_id: m.catalogoToyotaId,
            nombre_cargo_estandar: m.nombreCargoEstandar,
            nivel_toyota_sugerido: m.nivelToyota,
            confianza_match: m.confianza,
            es_auto_match: m.esAutoMatch,
            confirmado_por_admin: true,
          };
        });

      if (finalMappings.length > 0) {
        await supabase
          .from("organigrama_mappings")
          .upsert(finalMappings, { onConflict: "organigrama_cargo_id" });
      }

      // f. Update formulario_progreso
      const { data: concData } = await supabase
        .from("concesionarios")
        .select("formulario_progreso")
        .eq("id", concesionarioId)
        .single();

      if (concData) {
        const progreso =
          (concData.formulario_progreso as Record<string, boolean>) ?? {};
        progreso.organigrama = true;
        progreso.seccion1 = true; // Pre-filled from organigrama data
        await supabase
          .from("concesionarios")
          .update({
            formulario_progreso: progreso,
            formulario_estado: "en_progreso",
          })
          .eq("id", concesionarioId);
      }

      toast.success("Organigrama aprobado exitosamente");
      router.push("/admin/organigramas");
    } catch (err) {
      console.error(err);
      toast.error("Error al aprobar el organigrama");
    } finally {
      setIsApproving(false);
    }
  }

  // ── Visualization data for builder type ─────────────────────────────────

  const departamentos = useMemo(() => {
    const groups: Record<
      string,
      { nombre: string; cargos: { nombre: string; numPersonas: number }[] }
    > = {};
    for (const cargo of orgCargos) {
      const dept = cargo.departamento || "Sin departamento";
      if (!groups[dept]) groups[dept] = { nombre: dept, cargos: [] };
      groups[dept].cargos.push({
        nombre: cargo.nombre_cargo_dealer,
        numPersonas: cargo.num_personas,
      });
    }
    return Object.values(groups);
  }, [orgCargos]);

  const estadoConf = ESTADO_CONFIG[organigrama.estado] ?? {
    label: organigrama.estado,
    className: "bg-muted text-muted-foreground",
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {organigrama.concesionario?.nombre ?? "Concesionario"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {organigrama.concesionario?.zona}
            {organigrama.concesionario?.estado
              ? ` — ${organigrama.concesionario.estado}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={cn("text-xs font-normal border", estadoConf.className)}
          >
            {estadoConf.label}
          </Badge>
          <Badge variant="outline" className="text-xs font-normal gap-1">
            {organigrama.tipo === "upload" ? (
              <>
                <FileText className="h-3 w-3" /> Archivo
              </>
            ) : (
              <>
                <Users className="h-3 w-3" /> Constructor
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Preview */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Vista previa del organigrama
          </h2>

          {organigrama.tipo === "builder" ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <OrganigramaVisualization
                concesionarioNombre={
                  organigrama.concesionario?.nombre ?? "Concesionario"
                }
                departamentos={departamentos}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {organigrama.archivo_nombre ?? "Archivo adjunto"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    El archivo puede consultarse en Supabase Storage
                  </p>
                </div>
              </div>
              {organigrama.archivo_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const supabase = createClient();
                    const { data } = await supabase.storage
                      .from("organigramas")
                      .createSignedUrl(organigrama.archivo_url!, 3600);
                    if (data?.signedUrl) {
                      window.open(data.signedUrl, "_blank");
                    } else {
                      toast.error("No se pudo generar el enlace al archivo");
                    }
                  }}
                >
                  Abrir archivo
                </Button>
              )}
            </div>
          )}

          {/* Notas del concesionario */}
          {organigrama.notas_concesionario && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">
                  Notas del concesionario
                </h3>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {organigrama.notas_concesionario}
              </p>
            </div>
          )}

          {/* Notas admin */}
          <div className="rounded-xl border border-border bg-card p-4">
            <Label
              htmlFor="notas-admin"
              className="text-sm font-medium mb-2 block"
            >
              Notas del administrador
            </Label>
            <Textarea
              id="notas-admin"
              value={notasAdmin}
              onChange={(e) => setNotasAdmin(e.target.value)}
              placeholder="Agregar notas sobre este organigrama..."
              className="min-h-[80px] resize-y"
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Mapping Interface */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Mapeo de cargos ({orgCargos.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleAutoSuggest}
                disabled={isSuggesting}
              >
                {isSuggesting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                Auto-sugerir
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleConfirmAll}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Confirmar todos
              </Button>
            </div>
          </div>

          {/* Cargo mapping rows */}
          <div className="space-y-3">
            {orgCargos.map((cargo) => {
              const m = mappings[cargo.id];
              return (
                <div
                  key={cargo.id}
                  className={cn(
                    "rounded-xl border bg-card p-4 transition-colors",
                    m?.confirmado
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-border"
                  )}
                >
                  {/* Cargo header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {cargo.nombre_cargo_dealer}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cargo.departamento}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className="text-xs font-normal gap-1"
                      >
                        <Users className="h-3 w-3" />
                        {cargo.num_personas}
                      </Badge>
                      {m?.confianza != null && m.esAutoMatch && (
                        <Badge
                          className={cn(
                            "text-xs font-normal border",
                            m.confianza >= 0.8
                              ? "bg-green-500/15 text-green-400 border-green-500/30"
                              : m.confianza >= 0.5
                                ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                                : "bg-red-500/15 text-red-400 border-red-500/30"
                          )}
                        >
                          {Math.round(m.confianza * 100)}%
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Selects */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    {/* Catalogo Toyota select */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        Cargo estandar Toyota
                      </Label>
                      <Select
                        value={m?.catalogoToyotaId || undefined}
                        onValueChange={(val) => {
                          if (val) handleCatalogoChange(cargo.id, val);
                        }}
                      >
                        <SelectTrigger className="w-full text-xs h-9">
                          <SelectValue placeholder="Seleccionar cargo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(catalogoByCategoria).map(
                            ([categoria, entries]) => (
                              <SelectGroup key={categoria}>
                                <SelectLabel>{categoria}</SelectLabel>
                                {entries.map((entry) => (
                                  <SelectItem
                                    key={entry.id}
                                    value={entry.id}
                                  >
                                    {entry.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Nivel Toyota select */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        Nivel Toyota
                      </Label>
                      <Select
                        value={m?.nivelToyota || "no_aplica"}
                        onValueChange={(val) => {
                          if (val) updateMapping(cargo.id, { nivelToyota: val });
                        }}
                      >
                        <SelectTrigger className="w-full text-xs h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NIVELES.map((nivel) => (
                            <SelectItem key={nivel.value} value={nivel.value}>
                              {nivel.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Confirm checkbox */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={m?.confirmado ?? false}
                      onCheckedChange={(checked) =>
                        updateMapping(cargo.id, {
                          confirmado: checked === true,
                        })
                      }
                      disabled={!m?.catalogoToyotaId}
                    />
                    <Label className="text-xs text-muted-foreground cursor-pointer">
                      Confirmado por admin
                    </Label>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={handleSaveMappings}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar mapeos
            </Button>
            <Button
              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleApprove}
              disabled={!allConfirmed || isApproving}
            >
              {isApproving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Aprobar organigrama
            </Button>
          </div>

          {!allConfirmed && orgCargos.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Debes confirmar todos los mapeos antes de poder aprobar el
              organigrama.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
