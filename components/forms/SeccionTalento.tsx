"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useFormProgress } from "@/hooks/useFormProgress";
import { EDUCACION_MINIMA } from "@/lib/constants";
import type { Cargo } from "@/lib/types";
import { SaveIndicator } from "@/components/shared/SaveIndicator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { ArrowRight, AlertTriangle, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

interface SeccionTalentoProps {
  concesionarioId: string;
  cargos: Cargo[];
  soloMecanica?: boolean;
  readOnly?: boolean;
}

export default function SeccionTalento({
  concesionarioId,
  cargos,
  soloMecanica = false,
  readOnly,
}: SeccionTalentoProps) {
  const router = useRouter();
  const supabase = createClient();
  const { markSectionComplete } = useFormProgress(concesionarioId);

  const [perfiles, setPerfiles] = useState<Record<string, unknown>[]>([]);
  const [habilidadesFaltantes, setHabilidadesFaltantes] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      // Use cargos as-is (server already filtered if soloMecanica)
      const tallerCargos = cargos;

      const { data: existingPerfiles } = await supabase
        .from("perfiles_talento")
        .select("*")
        .eq("concesionario_id", concesionarioId);

      if (existingPerfiles && existingPerfiles.length > 0) {
        setPerfiles(
          tallerCargos.map((cargo) => {
            const existing = existingPerfiles.find(
              (p) => p.cargo_id === cargo.id
            );
            return {
              cargo_id: cargo.id,
              cargo_nombre: cargo.nombre_cargo_dealer
                ? `${cargo.nombre_cargo} (${cargo.nombre_cargo_dealer})`
                : cargo.nombre_cargo,
              educacion_minima: existing?.educacion_minima ?? "",
              certificacion_toyota_suficiente:
                existing?.certificacion_toyota_suficiente ?? false,
              formacion_adicional: existing?.formacion_adicional ?? "",
              experiencia_minima_anios:
                existing?.experiencia_minima_anios ?? null,
              habilidades_clave: existing?.habilidades_clave ?? "",
            };
          })
        );
        const withFaltantes = existingPerfiles.find(
          (p) => p.habilidades_faltantes
        );
        if (withFaltantes)
          setHabilidadesFaltantes(withFaltantes.habilidades_faltantes);
      } else {
        setPerfiles(
          tallerCargos.map((cargo) => ({
            cargo_id: cargo.id,
            cargo_nombre: cargo.nombre_cargo,
            educacion_minima: "",
            certificacion_toyota_suficiente: false,
            formacion_adicional: "",
            experiencia_minima_anios: null,
            habilidades_clave: "",
          }))
        );
      }
      setLoaded(true);
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formData = { perfiles, habilidadesFaltantes };

  const saveToDb = useCallback(
    async (data: typeof formData) => {
      await supabase
        .from("perfiles_talento")
        .delete()
        .eq("concesionario_id", concesionarioId);

      const validPerfiles = data.perfiles.filter((p) => p.cargo_id);
      if (validPerfiles.length > 0) {
        await supabase.from("perfiles_talento").insert(
          validPerfiles.map((p) => ({
            concesionario_id: concesionarioId,
            cargo_id: p.cargo_id as string,
            educacion_minima: (p.educacion_minima as string) || null,
            certificacion_toyota_suficiente:
              p.certificacion_toyota_suficiente as boolean,
            formacion_adicional: (p.formacion_adicional as string) || null,
            experiencia_minima_anios:
              p.experiencia_minima_anios as number | null,
            habilidades_clave: (p.habilidades_clave as string) || null,
            habilidades_faltantes: data.habilidadesFaltantes || null,
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
    await markSectionComplete("seccion4");
    router.push("/formulario/5");
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
          Complete primero la Sección 2 para definir los cargos.
        </p>
      </div>
    );
  }

  // Helper to update a perfil field by index
  function updatePerfil(index: number, field: string, value: unknown) {
    setPerfiles((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <GraduationCap size={16} />
          <span>
            <strong className="text-foreground">{perfiles.length}</strong> cargos
          </span>
        </div>
        <SaveIndicator status={status} />
      </div>

      {/* Instructions banner */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-muted-foreground">
        Los cargos se pre-llenaron de la Sección 2. Indique el perfil mínimo
        requerido para cada uno.
      </div>

      {/* Cargo cards */}
      <div className="space-y-4">
        {perfiles.map((perfil, index) => (
          <div
            key={perfil.cargo_id as string}
            className="rounded-xl bg-card border border-border p-4 sm:p-5"
          >
            {/* Card title: cargo name */}
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={16} className="text-primary shrink-0" />
              <h4 className="text-sm font-semibold text-foreground">
                {perfil.cargo_nombre as string}
              </h4>
            </div>

            {/* Fields grid: 2 columns on mobile, 3 on larger screens */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* Educacion minima - select */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Educación mínima
                </label>
                <Select
                  value={(perfil.educacion_minima as string) || undefined}
                  onValueChange={(v) => updatePerfil(index, "educacion_minima", v ?? "")}
                  disabled={readOnly}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCACION_MINIMA.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Certificacion Toyota suficiente - toggle */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Cert. Toyota suficiente
                </label>
                <div className="flex items-center h-10">
                  <Switch
                    checked={perfil.certificacion_toyota_suficiente as boolean}
                    onCheckedChange={(v) =>
                      updatePerfil(index, "certificacion_toyota_suficiente", v)
                    }
                    disabled={readOnly}
                  />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {perfil.certificacion_toyota_suficiente ? "Sí" : "No"}
                  </span>
                </div>
              </div>

              {/* Experiencia minima en años - number */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Experiencia mín. (años)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={perfil.experiencia_minima_anios != null ? String(perfil.experiencia_minima_anios) : ""}
                  onChange={(e) =>
                    updatePerfil(
                      index,
                      "experiencia_minima_anios",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  placeholder="0"
                  disabled={readOnly}
                  className="h-10"
                />
              </div>

              {/* Formacion adicional - text input (spans 2 cols on mobile) */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-xs text-muted-foreground">
                  Formación adicional
                </label>
                <Input
                  value={(perfil.formacion_adicional as string) || ""}
                  onChange={(e) =>
                    updatePerfil(index, "formacion_adicional", e.target.value)
                  }
                  placeholder="Ej: Curso de electrónica"
                  disabled={readOnly}
                  className="h-10"
                />
              </div>

              {/* Habilidades clave - text input (spans full width) */}
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs text-muted-foreground">
                  Habilidades clave
                </label>
                <Input
                  value={(perfil.habilidades_clave as string) || ""}
                  onChange={(e) =>
                    updatePerfil(index, "habilidades_clave", e.target.value)
                  }
                  placeholder="Ej: Diagnóstico, liderazgo, trabajo en equipo"
                  disabled={readOnly}
                  className="h-10"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Missing skills */}
      <div className="rounded-xl bg-card border border-border p-4 sm:p-6 space-y-2">
        <Label>
          ¿Qué le falta al equipo actual en general?
        </Label>
        <Textarea
          value={habilidadesFaltantes}
          onChange={(e) => setHabilidadesFaltantes(e.target.value)}
          placeholder="Describa las habilidades o competencias que su equipo necesita desarrollar..."
          rows={3}
          disabled={readOnly}
        />
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
