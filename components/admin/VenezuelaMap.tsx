"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";

interface Concesionario {
  id: string;
  nombre: string;
  zona: string | null;
  estado: string | null;
  formulario_estado: string;
  formulario_progreso: Record<string, boolean>;
  organigrama_estado: string;
}

const GEO_URL = "/venezuela-states.json";

const NAME_ALIASES: Record<string, string> = {
  Vargas: "La Guaira",
};

function normalizeEstado(raw: string): string {
  let n = raw.trim();
  n = n.replace(/^(edo\.?\s*|estado\s+)/i, "");
  if (NAME_ALIASES[n]) return NAME_ALIASES[n];
  const lower = n
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const map: Record<string, string> = {
    "distrito capital": "Distrito Capital",
    caracas: "Distrito Capital",
    "dtto capital": "Distrito Capital",
    vargas: "La Guaira",
    "la guaira": "La Guaira",
    "delta amacuro": "Delta Amacuro",
    "nueva esparta": "Nueva Esparta",
    tachira: "Táchira",
    merida: "Mérida",
    guarico: "Guárico",
    falcon: "Falcón",
    bolivar: "Bolívar",
    anzoategui: "Anzoátegui",
    zulia: "Zulia",
    lara: "Lara",
    trujillo: "Trujillo",
    barinas: "Barinas",
    portuguesa: "Portuguesa",
    cojedes: "Cojedes",
    yaracuy: "Yaracuy",
    carabobo: "Carabobo",
    aragua: "Aragua",
    miranda: "Miranda",
    sucre: "Sucre",
    monagas: "Monagas",
    apure: "Apure",
    amazonas: "Amazonas",
  };
  return map[lower] ?? n;
}

function normalizeGeoName(name: string | null): string | null {
  if (!name) return null;
  if (NAME_ALIASES[name]) return NAME_ALIASES[name];
  return name;
}

function getEstadoFill(concs: Concesionario[]): string {
  if (concs.length === 0) return "oklch(0.22 0 0)";
  if (concs.some((c) => c.formulario_estado === "completado"))
    return "rgba(204,0,0,0.85)";
  if (concs.some((c) => c.formulario_estado === "en_progreso"))
    return "rgba(204,0,0,0.55)";
  return "rgba(204,0,0,0.3)";
}

function getHoverFill(concs: Concesionario[]): string {
  if (concs.length === 0) return "oklch(0.30 0 0)";
  if (concs.some((c) => c.formulario_estado === "completado"))
    return "rgba(240,25,25,1)";
  if (concs.some((c) => c.formulario_estado === "en_progreso"))
    return "rgba(220,30,30,0.78)";
  return "rgba(204,0,0,0.5)";
}

function getProgressPct(
  p: Record<string, boolean> | null | undefined
): number {
  if (!p) return 0;
  const v = Object.values(p);
  return v.length > 0
    ? Math.round((v.filter(Boolean).length / v.length) * 100)
    : 0;
}

function getSectionsDone(
  p: Record<string, boolean> | null | undefined
): number {
  if (!p) return 0;
  return Object.values(p).filter(Boolean).length;
}

function getSectionsTotal(
  p: Record<string, boolean> | null | undefined
): number {
  if (!p) return 6;
  return Object.values(p).length || 6;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

const legendItems = [
  { color: "rgba(204,0,0,0.85)", label: "Completado" },
  { color: "rgba(204,0,0,0.55)", label: "En progreso" },
  { color: "rgba(204,0,0,0.3)", label: "Pendiente" },
  { color: "oklch(0.22 0 0)", label: "Sin conc." },
];

export default function VenezuelaMap({
  concesionarios,
}: {
  concesionarios: Concesionario[];
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!selected) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [selected]);

  useEffect(() => {
    if (selected) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selected]);

  const concsByEstado = useMemo(() => {
    const map = new Map<string, Concesionario[]>();
    for (const c of concesionarios) {
      if (!c.estado) continue;
      const key = normalizeEstado(c.estado);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [concesionarios]);

  const selectedConcs = selected ? (concsByEstado.get(selected) ?? []) : [];
  const selectedZona = selectedConcs[0]?.zona ?? null;
  const hoveredConcs = hovered ? (concsByEstado.get(hovered) ?? []) : [];
  const hoveredCompletados = hoveredConcs.filter(
    (c) => c.formulario_estado === "completado"
  ).length;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [isMobile]
  );

  const panelContent = (
    <div className="p-6">
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-xl font-bold">{selected}</h3>
        <button
          onClick={() => setSelected(null)}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground -mt-0.5"
        >
          <X size={18} />
        </button>
      </div>
      {selectedZona && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
          <MapPin size={12} /> Zona {selectedZona}
        </p>
      )}
      <div className="h-0.5 w-16 bg-primary rounded-full mt-4 mb-5" />

      {selectedConcs.length > 0 ? (
        <>
          <p className="text-xs text-muted-foreground mb-4">
            {selectedConcs.length} concesionario
            {selectedConcs.length > 1 ? "s" : ""}
          </p>
          <div className="space-y-3">
            {selectedConcs.map((c, i) => {
              const pct = getProgressPct(c.formulario_progreso);
              const done = getSectionsDone(c.formulario_progreso);
              const secTotal = getSectionsTotal(c.formulario_progreso);
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.08,
                    duration: 0.3,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  onClick={() =>
                    router.push(`/admin/concesionarios/${c.id}`)
                  }
                  className="rounded-lg border border-border p-4 hover:bg-accent/30 cursor-pointer transition-colors"
                >
                  <p className="text-sm font-semibold mb-2">{c.nombre}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        c.formulario_estado === "completado"
                          ? "bg-success/10 text-success"
                          : c.formulario_estado === "en_progreso"
                            ? "bg-warning/10 text-warning"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          c.formulario_estado === "completado"
                            ? "bg-success"
                            : c.formulario_estado === "en_progreso"
                              ? "bg-warning"
                              : "bg-muted-foreground"
                        }`}
                      />
                      {c.formulario_estado === "completado"
                        ? "Completado"
                        : c.formulario_estado === "en_progreso"
                          ? "En progreso"
                          : "Pendiente"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        c.organigrama_estado === "aprobado"
                          ? "bg-success/10 text-success"
                          : c.organigrama_estado === "pendiente" ||
                              c.organigrama_estado === "en_revision"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          c.organigrama_estado === "aprobado"
                            ? "bg-success"
                            : c.organigrama_estado === "pendiente" ||
                                c.organigrama_estado === "en_revision"
                              ? "bg-blue-400"
                              : "bg-muted-foreground"
                        }`}
                      />
                      Org:{" "}
                      {c.organigrama_estado === "aprobado"
                        ? "Aprobado"
                        : c.organigrama_estado === "en_revision"
                          ? "En revisión"
                          : c.organigrama_estado === "pendiente"
                            ? "Pendiente"
                            : "No enviado"}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct === 100 ? "bg-success" : "bg-primary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {done}/{secTotal} secciones
                  </p>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 size={44} className="text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            Sin concesionarios registrados
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            No hay concesionarios en este estado
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div
        className="relative"
        ref={containerRef}
        onMouseMove={handleMouseMove}
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: [-66, 6.5],
            scale: isMobile ? 2400 : 2200,
          }}
          width={800}
          height={isMobile ? 600 : 480}
          style={{ width: "100%", height: "auto", minHeight: isMobile ? 350 : undefined }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const rawName =
                  (geo.properties.NAME_1 as string) ?? null;
                const geoName = normalizeGeoName(rawName);
                if (!geoName) return null;
                if (
                  rawName === "Dependencias Federales" ||
                  geoName === "Dependencias Federales"
                )
                  return null;

                const concs = concsByEstado.get(geoName) ?? [];
                const hasConcs = concs.length > 0;
                const isSelected = selected === geoName;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => setHovered(geoName)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() =>
                      setSelected((prev) =>
                        prev === geoName ? null : geoName
                      )
                    }
                    style={{
                      default: {
                        fill: isSelected
                          ? "rgba(255,40,40,0.95)"
                          : getEstadoFill(concs),
                        stroke: "oklch(0.35 0 0)",
                        strokeWidth: 0.5,
                        outline: "none",
                        cursor: hasConcs ? "pointer" : "default",
                        transition: "fill 0.2s ease, stroke 0.2s ease",
                        filter: isSelected
                          ? "drop-shadow(0 0 6px rgba(204,0,0,0.4))"
                          : "none",
                      },
                      hover: {
                        fill: isSelected
                          ? "rgba(255,40,40,0.95)"
                          : getHoverFill(concs),
                        stroke: hasConcs
                          ? "oklch(0.55 0 0)"
                          : "oklch(0.45 0 0)",
                        strokeWidth: hasConcs ? 1 : 0.6,
                        outline: "none",
                        cursor: hasConcs ? "pointer" : "default",
                        filter: hasConcs
                          ? "drop-shadow(0 0 8px rgba(204,0,0,0.35))"
                          : "none",
                      },
                      pressed: {
                        fill: "rgba(204,0,0,1)",
                        stroke: "oklch(0.55 0 0)",
                        strokeWidth: 1,
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        {/* Legend — overlay on desktop only */}
        {!isMobile && (
          <div className="absolute top-3 right-3 z-20 bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-3">
            <div className="flex flex-col gap-2 text-[11px] text-muted-foreground">
              {legendItems.map((item) => (
                <span key={item.label} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-[3px] shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label === "Sin conc." ? "Sin concesionarios" : item.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tooltip — desktop only, follows cursor */}
        {!isMobile && (
          <AnimatePresence>
            {hovered && !selected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="absolute z-30 pointer-events-none"
                style={{
                  left: mousePos.x + 16,
                  top: mousePos.y - 10,
                }}
              >
                <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-lg px-4 py-2.5 shadow-xl min-w-[140px]">
                  <p className="text-xs font-semibold text-white">{hovered}</p>
                  {hoveredConcs.length > 0 ? (
                    <>
                      <p className="text-[10px] text-white/60 mt-0.5">
                        {hoveredConcs.length} concesionario(s)
                      </p>
                      <div className="mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${hoveredConcs.length > 0 ? (hoveredCompletados / hoveredConcs.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <p className="text-[9px] text-white/40 mt-0.5">
                        {hoveredCompletados}/{hoveredConcs.length} completados
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] text-white/40 mt-0.5">
                      Sin concesionarios
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Legend — below map on mobile */}
      {isMobile && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-2 pt-2 pb-1">
          {legendItems.map((item) => (
            <span
              key={item.label}
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
            >
              <span
                className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
      )}

      {/* Drawer panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSelected(null)}
            />
            {isMobile ? (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="fixed bottom-0 left-0 w-full max-h-[70vh] bg-card border-t border-border z-50 overflow-y-auto shadow-2xl rounded-t-2xl"
              >
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
                </div>
                {panelContent}
              </motion.div>
            ) : (
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="fixed right-0 top-0 h-full w-[400px] max-w-[90vw] bg-card border-l border-border z-50 overflow-y-auto shadow-2xl"
              >
                {panelContent}
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
}
