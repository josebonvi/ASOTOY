"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Plus,
  Trash2,
  Building2,
  Users,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Send,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CargoNode {
  id: string;
  nombre: string;
  numPersonas: number;
}

interface DepartamentoNode {
  id: string;
  nombre: string;
  cargos: CargoNode[];
  collapsed: boolean;
}

interface OrganigramaBuilderProps {
  concesionarioId: string;
  concesionarioNombre: string;
  onComplete: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _nodeId = 0;
function nodeId() {
  return `node_${Date.now()}_${++_nodeId}`;
}

// ─── SVG Connector ───────────────────────────────────────────────────────────

function Connector({
  from,
  to,
  containerRef,
}: {
  from: string;
  to: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [path, setPath] = useState("");

  useEffect(() => {
    function update() {
      const container = containerRef.current;
      const fromEl = document.getElementById(from);
      const toEl = document.getElementById(to);
      if (!container || !fromEl || !toEl) return;

      const cRect = container.getBoundingClientRect();
      const fRect = fromEl.getBoundingClientRect();
      const tRect = toEl.getBoundingClientRect();

      const x1 = fRect.left + fRect.width / 2 - cRect.left;
      const y1 = fRect.bottom - cRect.top;
      const x2 = tRect.left + tRect.width / 2 - cRect.left;
      const y2 = tRect.top - cRect.top;

      const midY = (y1 + y2) / 2;
      setPath(`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`);
    }

    update();
    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("scroll", update, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update, true);
    };
  }, [from, to, containerRef]);

  if (!path) return null;

  return (
    <path
      d={path}
      fill="none"
      stroke="oklch(0.50 0.22 29 / 40%)"
      strokeWidth="2"
      strokeDasharray="6 4"
    />
  );
}

// ─── Cargo Card ──────────────────────────────────────────────────────────────

function CargoCard({
  cargo,
  onUpdate,
  onRemove,
}: {
  cargo: CargoNode;
  onUpdate: (id: string, field: keyof CargoNode, value: string | number) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, height: 0 }}
      transition={{ duration: 0.2 }}
      id={`cargo-${cargo.id}`}
      className="group relative flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 transition-colors hover:border-primary/30"
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 cursor-grab" />

      <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

      <Input
        value={cargo.nombre}
        onChange={(e) => onUpdate(cargo.id, "nombre", e.target.value)}
        placeholder="Nombre del cargo..."
        className="h-7 flex-1 border-0 bg-transparent px-1 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
      />

      <div className="flex items-center gap-1">
        <Users className="h-3 w-3 text-muted-foreground" />
        <Input
          type="number"
          min={1}
          value={cargo.numPersonas}
          onChange={(e) =>
            onUpdate(cargo.id, "numPersonas", Math.max(1, parseInt(e.target.value) || 1))
          }
          className="h-7 w-14 border-0 bg-transparent px-1 text-center text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      <button
        title="Eliminar cargo"
        onClick={() => onRemove(cargo.id)}
        className="rounded p-1 text-muted-foreground/50 opacity-0 transition-all hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

// ─── Departamento Card ───────────────────────────────────────────────────────

function DepartamentoCard({
  depto,
  onUpdate,
  onRemove,
  onAddCargo,
  onUpdateCargo,
  onRemoveCargo,
}: {
  depto: DepartamentoNode;
  onUpdate: (id: string, field: string, value: string | boolean) => void;
  onRemove: (id: string) => void;
  onAddCargo: (deptoId: string) => void;
  onUpdateCargo: (
    deptoId: string,
    cargoId: string,
    field: keyof CargoNode,
    value: string | number
  ) => void;
  onRemoveCargo: (deptoId: string, cargoId: string) => void;
}) {
  const totalPersonas = depto.cargos.reduce((sum, c) => sum + c.numPersonas, 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, height: 0 }}
      transition={{ duration: 0.25 }}
      id={`depto-${depto.id}`}
      className="w-full max-w-md"
    >
      <Card className="overflow-visible border-primary/20 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            title={depto.collapsed ? "Expandir" : "Colapsar"}
            onClick={() => onUpdate(depto.id, "collapsed", !depto.collapsed)}
            className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            {depto.collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <Building2 className="h-4 w-4 shrink-0 text-primary" />

          <Input
            value={depto.nombre}
            onChange={(e) => onUpdate(depto.id, "nombre", e.target.value)}
            placeholder="Nombre del departamento..."
            className="h-8 flex-1 border-0 bg-transparent px-1 text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-normal">
              {depto.cargos.length} cargo{depto.cargos.length !== 1 ? "s" : ""}
            </Badge>
            <Badge variant="outline" className="text-xs font-normal">
              {totalPersonas} persona{totalPersonas !== 1 ? "s" : ""}
            </Badge>
          </div>

          <button
            title="Eliminar departamento"
            onClick={() => onRemove(depto.id)}
            className="rounded p-1 text-muted-foreground/50 transition-all hover:bg-destructive/20 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <AnimatePresence>
          {!depto.collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="space-y-2 pt-0">
                <LayoutGroup>
                  <AnimatePresence>
                    {depto.cargos.map((cargo) => (
                      <CargoCard
                        key={cargo.id}
                        cargo={cargo}
                        onUpdate={(cId, field, val) =>
                          onUpdateCargo(depto.id, cId, field, val)
                        }
                        onRemove={(cId) => onRemoveCargo(depto.id, cId)}
                      />
                    ))}
                  </AnimatePresence>
                </LayoutGroup>

                <button
                  onClick={() => onAddCargo(depto.id)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/50 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar cargo
                </button>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ─── Main Builder ────────────────────────────────────────────────────────────

export default function OrganigramaBuilder({
  concesionarioId,
  concesionarioNombre,
  onComplete,
}: OrganigramaBuilderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [departamentos, setDepartamentos] = useState<DepartamentoNode[]>([
    {
      id: nodeId(),
      nombre: "",
      collapsed: false,
      cargos: [{ id: nodeId(), nombre: "", numPersonas: 1 }],
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Departamento actions ─────────────────────────────────────────────────

  const addDepartamento = useCallback(() => {
    setDepartamentos((prev) => [
      ...prev,
      {
        id: nodeId(),
        nombre: "",
        collapsed: false,
        cargos: [{ id: nodeId(), nombre: "", numPersonas: 1 }],
      },
    ]);
  }, []);

  const updateDepartamento = useCallback(
    (id: string, field: string, value: string | boolean) => {
      setDepartamentos((prev) =>
        prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
      );
    },
    []
  );

  const removeDepartamento = useCallback((id: string) => {
    setDepartamentos((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // ── Cargo actions ────────────────────────────────────────────────────────

  const addCargo = useCallback((deptoId: string) => {
    setDepartamentos((prev) =>
      prev.map((d) =>
        d.id === deptoId
          ? {
              ...d,
              cargos: [
                ...d.cargos,
                { id: nodeId(), nombre: "", numPersonas: 1 },
              ],
            }
          : d
      )
    );
  }, []);

  const updateCargo = useCallback(
    (
      deptoId: string,
      cargoId: string,
      field: keyof CargoNode,
      value: string | number
    ) => {
      setDepartamentos((prev) =>
        prev.map((d) =>
          d.id === deptoId
            ? {
                ...d,
                cargos: d.cargos.map((c) =>
                  c.id === cargoId ? { ...c, [field]: value } : c
                ),
              }
            : d
        )
      );
    },
    []
  );

  const removeCargo = useCallback((deptoId: string, cargoId: string) => {
    setDepartamentos((prev) =>
      prev.map((d) =>
        d.id === deptoId
          ? { ...d, cargos: d.cargos.filter((c) => c.id !== cargoId) }
          : d
      )
    );
  }, []);

  // ── Stats ────────────────────────────────────────────────────────────────

  const totalCargos = departamentos.reduce((s, d) => s + d.cargos.length, 0);
  const totalPersonas = departamentos.reduce(
    (s, d) => s + d.cargos.reduce((cs, c) => cs + c.numPersonas, 0),
    0
  );

  // ── Validation ───────────────────────────────────────────────────────────

  const isValid = departamentos.length > 0 && departamentos.every(
    (d) =>
      d.nombre.trim() !== "" &&
      d.cargos.length > 0 &&
      d.cargos.every((c) => c.nombre.trim() !== "" && c.numPersonas >= 1)
  );

  // ── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!isValid || saving) return;
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      // 1. Create organigrama record
      const { data: org, error: orgError } = await supabase
        .from("organigramas")
        .insert({
          concesionario_id: concesionarioId,
          tipo: "builder",
          estado: "pendiente",
        })
        .select("id")
        .single();

      if (orgError) throw orgError;

      // 2. Insert all cargos
      let orden = 0;
      const cargosToInsert = departamentos.flatMap((d) =>
        d.cargos.map((c) => ({
          organigrama_id: org.id,
          concesionario_id: concesionarioId,
          nombre_cargo_dealer: c.nombre.trim(),
          departamento: d.nombre.trim(),
          num_personas: c.numPersonas,
          orden: orden++,
        }))
      );

      const { error: cargosError } = await supabase
        .from("organigrama_cargos")
        .insert(cargosToInsert);

      if (cargosError) throw cargosError;

      // 3. Update concesionario estado
      const { error: updateError } = await supabase
        .from("concesionarios")
        .update({ organigrama_estado: "pendiente" })
        .eq("id", concesionarioId);

      if (updateError) throw updateError;

      onComplete();
    } catch (err) {
      console.error("Error al enviar organigrama:", err);
      setError("Error al enviar el organigrama. Intente nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-semibold">Construya su organigrama</h2>
        <p className="text-sm text-muted-foreground">
          Agregue los departamentos y cargos de su concesionario con los nombres
          que ustedes usan internamente
        </p>
      </div>

      {/* Tree Container */}
      <div ref={containerRef} className="relative space-y-4">
        {/* SVG connectors layer */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ zIndex: 0 }}
        >
          {departamentos.map((d) => (
            <Connector
              key={`root-${d.id}`}
              from="root-node"
              to={`depto-${d.id}`}
              containerRef={containerRef}
            />
          ))}
        </svg>

        {/* Root node */}
        <div className="flex justify-center" style={{ position: "relative", zIndex: 1 }}>
          <motion.div
            id="root-node"
            layout
            className="inline-flex items-center gap-2 rounded-xl border-2 border-primary/40 bg-primary/10 px-5 py-3"
          >
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">
              {concesionarioNombre || "Mi Concesionario"}
            </span>
            <Badge className="bg-primary/20 text-primary text-xs">
              {totalPersonas} personas
            </Badge>
          </motion.div>
        </div>

        {/* Departamentos grid */}
        <div
          className="flex flex-wrap items-start justify-center gap-4"
          style={{ position: "relative", zIndex: 1 }}
        >
          <LayoutGroup>
            <AnimatePresence>
              {departamentos.map((depto) => (
                <DepartamentoCard
                  key={depto.id}
                  depto={depto}
                  onUpdate={updateDepartamento}
                  onRemove={removeDepartamento}
                  onAddCargo={addCargo}
                  onUpdateCargo={updateCargo}
                  onRemoveCargo={removeCargo}
                />
              ))}
            </AnimatePresence>
          </LayoutGroup>
        </div>

        {/* Add departamento button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={addDepartamento}
            className="border-dashed border-primary/30 text-primary hover:bg-primary/10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar departamento
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 px-4 py-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            <Building2 className="mr-1 inline h-4 w-4" />
            {departamentos.length} departamento{departamentos.length !== 1 ? "s" : ""}
          </span>
          <span>
            <Briefcase className="mr-1 inline h-4 w-4" />
            {totalCargos} cargo{totalCargos !== 1 ? "s" : ""}
          </span>
          <span>
            <Users className="mr-1 inline h-4 w-4" />
            {totalPersonas} persona{totalPersonas !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-destructive"
        >
          {error}
        </motion.p>
      )}

      {/* Submit */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!isValid || saving}
          className="min-w-48"
        >
          {saving ? (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              Enviando...
            </motion.span>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enviar organigrama
            </>
          )}
        </Button>
      </div>

      {!isValid && departamentos.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Complete todos los nombres de departamentos y cargos antes de enviar
        </p>
      )}
    </div>
  );
}
