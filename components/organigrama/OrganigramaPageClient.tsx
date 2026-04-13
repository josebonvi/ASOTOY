"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Upload,
  Hammer,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  ArrowLeft,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import OrganigramaUpload from "@/components/organigrama/OrganigramaUpload";
import OrganigramaBuilder from "@/components/organigrama/OrganigramaBuilder";
import OrganigramaVisualization from "@/components/organigrama/OrganigramaVisualization";
import type { OrganigramaPageData } from "@/app/(dealer)/organigrama/page";

// ─── Animation variants ─────────────────────────────────────────────────────

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

// ─── No Iniciado — choose mode ──────────────────────────────────────────────

function EstadoNoIniciado({
  concesionarioId,
  concesionarioNombre,
  onComplete,
}: {
  concesionarioId: string;
  concesionarioNombre: string;
  onComplete: () => void;
}) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeIn} className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
          <GitBranch className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Organigrama de su concesionario
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Antes de comenzar el formulario, necesitamos conocer la estructura
          organizacional de{" "}
          <span className="font-medium text-foreground">
            {concesionarioNombre}
          </span>
          . Elija como prefiere compartir su organigrama.
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeIn}>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="mx-auto mb-6 w-full max-w-md">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Subir organigrama
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <Hammer className="h-4 w-4" />
              Construir organigrama
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <div className="mx-auto max-w-lg">
              <div className="rounded-xl border border-border bg-card/50 p-6">
                <div className="mb-4 text-center">
                  <h2 className="text-base font-semibold text-foreground">
                    Subir archivo existente
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Si ya tiene un organigrama en PDF, imagen, Excel o
                    PowerPoint, puede subirlo directamente.
                  </p>
                </div>
                <OrganigramaUpload
                  concesionarioId={concesionarioId}
                  onComplete={onComplete}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="builder">
            <div className="mx-auto max-w-4xl">
              <div className="rounded-xl border border-border bg-card/50 p-6">
                <OrganigramaBuilder
                  concesionarioId={concesionarioId}
                  concesionarioNombre={concesionarioNombre}
                  onComplete={onComplete}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

// ─── Pendiente / En Revision ────────────────────────────────────────────────

function EstadoPendiente({
  data,
}: {
  data: OrganigramaPageData;
}) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Success banner */}
      <motion.div
        variants={fadeIn}
        className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 text-center"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">
          Su organigrama ha sido enviado correctamente
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
          Nuestro equipo esta procesando su informacion. Le notificaremos cuando
          pueda continuar con el formulario.
        </p>
        <Badge className="mt-3 bg-primary/15 text-primary border-primary/20">
          {data.organigramaEstado === "en_revision"
            ? "En revision"
            : "Pendiente de revision"}
        </Badge>
      </motion.div>

      {/* Show visualization or file info */}
      <motion.div variants={fadeIn}>
        {data.organigrama?.tipo === "builder" && data.departamentos.length > 0 ? (
          <div className="rounded-xl border border-border bg-card/50 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Su organigrama enviado
            </h2>
            <OrganigramaVisualization
              concesionarioNombre={data.concesionarioNombre}
              departamentos={data.departamentos}
            />
          </div>
        ) : data.organigrama?.tipo === "upload" ? (
          <div className="rounded-xl border border-border bg-card/50 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Archivo enviado
            </h2>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-3">
              <FileText className="h-5 w-5 text-primary" />
              <span className="flex-1 text-sm font-medium text-foreground">
                {data.organigrama.archivo_nombre ?? "Archivo"}
              </span>
              <Badge className="bg-green-500/15 text-green-400 border-green-500/20">
                Archivo enviado
              </Badge>
            </div>
          </div>
        ) : null}
      </motion.div>

      {/* Link back */}
      <motion.div variants={fadeIn} className="flex justify-center">
        <Link href="/inicio">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}

// ─── Aprobado ───────────────────────────────────────────────────────────────

function EstadoAprobado({
  data,
}: {
  data: OrganigramaPageData;
}) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Approved banner */}
      <motion.div
        variants={fadeIn}
        className="rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent p-6 text-center"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
          <CheckCircle2 className="h-6 w-6 text-green-400" />
        </div>
        <h1 className="text-xl font-bold text-foreground">
          Organigrama aprobado
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
          Su organigrama ha sido revisado y aprobado. Ya puede continuar con el
          formulario de remuneracion.
        </p>
        <Badge className="mt-3 bg-green-500/15 text-green-400 border-green-500/20">
          Aprobado
        </Badge>
      </motion.div>

      {/* Show visualization */}
      {data.departamentos.length > 0 && (
        <motion.div variants={fadeIn}>
          <div className="rounded-xl border border-border bg-card/50 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Su organigrama
            </h2>
            <OrganigramaVisualization
              concesionarioNombre={data.concesionarioNombre}
              departamentos={data.departamentos}
            />
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div variants={fadeIn} className="flex justify-center">
        <Link href="/inicio">
          <Button size="lg" className="min-w-48">
            Continuar al formulario
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Client Component ──────────────────────────────────────────────────

export default function OrganigramaPageClient({
  data,
}: {
  data: OrganigramaPageData;
}) {
  const router = useRouter();

  function handleComplete() {
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl py-4">
      {data.organigramaEstado === "no_iniciado" && (
        <EstadoNoIniciado
          concesionarioId={data.concesionarioId}
          concesionarioNombre={data.concesionarioNombre}
          onComplete={handleComplete}
        />
      )}

      {(data.organigramaEstado === "pendiente" ||
        data.organigramaEstado === "en_revision") && (
        <EstadoPendiente data={data} />
      )}

      {data.organigramaEstado === "aprobado" && (
        <EstadoAprobado data={data} />
      )}
    </div>
  );
}
