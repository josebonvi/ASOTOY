"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { FormularioProgreso } from "@/lib/types";

export default function ConfirmacionPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [concesionarioId, setConcesionarioId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [progreso, setProgreso] = useState<FormularioProgreso | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("concesionarios")
        .select("id, nombre, formulario_estado, formulario_progreso")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setConcesionarioId(data.id);
        setNombre(data.nombre);
        setIsCompleted(data.formulario_estado === "completado");
        setProgreso(data.formulario_progreso as FormularioProgreso);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allComplete = progreso
    ? Object.values(progreso).every(Boolean)
    : false;

  async function handleSubmit() {
    if (!concesionarioId || !allComplete) return;
    setLoading(true);

    await supabase
      .from("concesionarios")
      .update({ formulario_estado: "completado" })
      .eq("id", concesionarioId);

    setIsCompleted(true);
    setLoading(false);
    router.refresh();
  }

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/15 mb-6"
        >
          <CheckCircle2 size={40} className="text-success" />
        </motion.div>
        <h1 className="text-2xl font-bold mb-2">
          ¡Formulario enviado exitosamente!
        </h1>
        <p className="text-muted-foreground mb-2">
          Gracias, <span className="font-semibold text-foreground">{nombre}</span>.
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Su información ha sido recibida y será procesada por el equipo de
          ASOTOY.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Los resultados del estudio serán compartidos con todos los concesionarios participantes una vez completemos la recolección en toda la red.
        </p>
        <Link href="/inicio">
          <Button variant="outline">
            <ArrowLeft size={16} className="mr-2" />
            Volver al inicio
          </Button>
        </Link>
      </div>
    );
  }

  if (!allComplete) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h1 className="text-2xl font-bold mb-2">Formulario incompleto</h1>
        <p className="text-muted-foreground mb-6">
          Aún faltan secciones por completar. Regrese al inicio para ver cuáles.
        </p>
        <Link href="/inicio">
          <Button variant="outline">
            <ArrowLeft size={16} className="mr-2" />
            Volver al inicio
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/15 mb-4">
          <Send size={28} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Confirmar y enviar</h1>
        <p className="text-muted-foreground">
          Ha completado las 5 secciones del formulario. Una vez enviado, no
          podrá modificar las respuestas.
        </p>
      </div>

      {/* Section summary */}
      <div className="rounded-xl bg-card border border-border p-6 mb-6">
        <h3 className="text-sm font-semibold mb-4">Resumen de secciones</h3>
        {progreso &&
          Object.entries(progreso).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <span className="text-sm capitalize">
                {key.replace("seccion", "Sección ")}
              </span>
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${
                  value
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {value ? "Completada" : "Pendiente"}
              </span>
            </div>
          ))}
      </div>

      <div className="flex gap-3 justify-center">
        <Link href="/inicio">
          <Button variant="outline">
            <ArrowLeft size={16} className="mr-2" />
            Revisar respuestas
          </Button>
        </Link>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Enviando..." : "Confirmar y enviar"}
          {!loading && <Send size={16} className="ml-2" />}
        </Button>
      </div>
    </div>
  );
}
