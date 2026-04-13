"use client";

import { useRef, useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Briefcase, GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Cargo {
  nombre: string;
  numPersonas: number;
}

interface Departamento {
  nombre: string;
  cargos: Cargo[];
}

interface OrgVisualizationProps {
  concesionarioNombre: string;
  departamentos: Departamento[];
}

// ─── SVG Connector (read-only) ──────────────────────────────────────────────

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

  const update = useCallback(() => {
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
  }, [from, to, containerRef]);

  useEffect(() => {
    update();
    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [update, containerRef]);

  if (!path) return null;

  return (
    <path
      d={path}
      fill="none"
      stroke="oklch(0.50 0.22 29 / 30%)"
      strokeWidth="2"
      strokeDasharray="6 4"
    />
  );
}

// ─── Stagger animation variants ─────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

const cargoVariants = {
  hidden: { opacity: 0, x: -10 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function OrganigramaVisualization({
  concesionarioNombre,
  departamentos,
}: OrgVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // ── Stats ───────────────────────────────────────────────────────────────

  const totalDepartamentos = departamentos.length;
  const totalCargos = departamentos.reduce(
    (sum, d) => sum + d.cargos.length,
    0
  );
  const totalPersonas = departamentos.reduce(
    (sum, d) => sum + d.cargos.reduce((cs, c) => cs + c.numPersonas, 0),
    0
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Tree Container */}
      <div ref={containerRef} className="relative space-y-6">
        {/* SVG connectors layer — desktop only */}
        {mounted && (
          <svg
            className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
            style={{ zIndex: 0 }}
          >
            {departamentos.map((d, i) => (
              <Connector
                key={`viz-conn-${i}`}
                from="viz-root-node"
                to={`viz-depto-${i}`}
                containerRef={containerRef}
              />
            ))}
          </svg>
        )}

        {/* Root node */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div
            id="viz-root-node"
            className="inline-flex items-center gap-3 rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 px-6 py-4 shadow-lg shadow-primary/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Concesionario
              </p>
              <p className="text-lg font-bold text-primary">
                {concesionarioNombre}
              </p>
            </div>
            <Badge className="ml-2 bg-primary/20 text-primary text-xs">
              {totalPersonas} personas
            </Badge>
          </div>
        </motion.div>

        {/* ── Mobile: vertical list ── */}
        <motion.div
          variants={containerVariants}
          className="flex flex-col gap-4 md:hidden"
          style={{ position: "relative", zIndex: 1 }}
        >
          {departamentos.map((depto, di) => (
            <motion.div
              key={`mob-${di}`}
              variants={itemVariants}
              className="rounded-xl border border-primary/20 bg-card/80 p-4 shadow-md shadow-black/5 backdrop-blur-sm"
            >
              {/* Department header */}
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <h3 className="flex-1 text-sm font-semibold text-foreground">
                  {depto.nombre}
                </h3>
                <Badge variant="outline" className="text-xs font-normal">
                  {depto.cargos.reduce((s, c) => s + c.numPersonas, 0)} personas
                </Badge>
              </div>

              {/* Cargos */}
              <div className="space-y-1.5 pl-2 border-l-2 border-primary/10 ml-4">
                {depto.cargos.map((cargo, ci) => (
                  <motion.div
                    key={`mob-cargo-${di}-${ci}`}
                    variants={cargoVariants}
                    className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2"
                  >
                    <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-sm text-foreground">
                      {cargo.nombre}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs font-normal tabular-nums"
                    >
                      <Users className="mr-1 h-3 w-3" />
                      {cargo.numPersonas}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Desktop: tree layout ── */}
        <motion.div
          variants={containerVariants}
          className="hidden flex-wrap items-start justify-center gap-5 md:flex"
          style={{ position: "relative", zIndex: 1 }}
        >
          {departamentos.map((depto, di) => (
            <motion.div
              key={`desk-${di}`}
              id={`viz-depto-${di}`}
              variants={itemVariants}
              className="w-full max-w-xs rounded-xl border border-primary/20 bg-card/80 shadow-md shadow-black/5 backdrop-blur-sm"
            >
              {/* Department header */}
              <div className="flex items-center gap-2.5 border-b border-border/50 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {depto.nombre}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {depto.cargos.length} cargo
                    {depto.cargos.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-normal shrink-0">
                  {depto.cargos.reduce((s, c) => s + c.numPersonas, 0)} pers.
                </Badge>
              </div>

              {/* Cargos */}
              <motion.div
                variants={containerVariants}
                className="space-y-1 p-3"
              >
                {depto.cargos.map((cargo, ci) => (
                  <motion.div
                    key={`desk-cargo-${di}-${ci}`}
                    variants={cargoVariants}
                    className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2 transition-colors hover:bg-secondary/60"
                  >
                    <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-sm text-foreground">
                      {cargo.nombre}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary tabular-nums">
                      <Users className="h-3 w-3" />
                      {cargo.numPersonas}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Summary bar */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap items-center justify-center gap-4 rounded-xl border border-border/50 bg-secondary/30 px-5 py-3 sm:gap-6"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <GitBranch className="h-3.5 w-3.5 text-primary" />
          </div>
          <span>
            <span className="font-semibold text-foreground">
              {totalDepartamentos}
            </span>{" "}
            departamento{totalDepartamentos !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <Briefcase className="h-3.5 w-3.5 text-primary" />
          </div>
          <span>
            <span className="font-semibold text-foreground">{totalCargos}</span>{" "}
            cargo{totalCargos !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <Users className="h-3.5 w-3.5 text-primary" />
          </div>
          <span>
            <span className="font-semibold text-foreground">
              {totalPersonas}
            </span>{" "}
            persona{totalPersonas !== 1 ? "s" : ""}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
