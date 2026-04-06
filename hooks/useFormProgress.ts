"use client";

import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FormularioProgreso } from "@/lib/types";

export function useFormProgress(concesionarioId: string) {
  const supabase = createClient();

  const markSectionComplete = useCallback(
    async (sectionKey: keyof FormularioProgreso) => {
      // Fetch current progress
      const { data } = await supabase
        .from("concesionarios")
        .select("formulario_progreso")
        .eq("id", concesionarioId)
        .single();

      if (!data) return;

      const progreso = data.formulario_progreso as FormularioProgreso;
      progreso[sectionKey] = true;

      // Check if all sections are complete
      const allComplete = Object.values(progreso).every(Boolean);

      await supabase
        .from("concesionarios")
        .update({
          formulario_progreso: progreso,
          formulario_estado: allComplete ? "completado" : "en_progreso",
        })
        .eq("id", concesionarioId);
    },
    [concesionarioId, supabase]
  );

  const updateEstado = useCallback(
    async (estado: "pendiente" | "en_progreso" | "completado") => {
      await supabase
        .from("concesionarios")
        .update({ formulario_estado: estado })
        .eq("id", concesionarioId);
    },
    [concesionarioId, supabase]
  );

  return { markSectionComplete, updateEstado };
}
