"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useFormProgress } from "@/hooks/useFormProgress";
import { INTERES_COLLEGE } from "@/lib/constants";
import { SaveIndicator } from "@/components/shared/SaveIndicator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface SeccionNecesidadesProps {
  concesionarioId: string;
  readOnly?: boolean;
}

export default function SeccionNecesidades({
  concesionarioId,
  readOnly,
}: SeccionNecesidadesProps) {
  const router = useRouter();
  const supabase = createClient();
  const { markSectionComplete } = useFormProgress(concesionarioId);

  const [cargosDificiles, setCargosDificiles] = useState("");
  const [habilidadesEscasas, setHabilidadesEscasas] = useState("");
  const [formacionNecesaria, setFormacionNecesaria] = useState("");
  const [interesCollege, setInteresCollege] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from("necesidades")
        .select("*")
        .eq("concesionario_id", concesionarioId)
        .single();

      if (data) {
        setExistingId(data.id);
        setCargosDificiles(data.cargos_dificiles_cubrir ?? "");
        setHabilidadesEscasas(data.habilidades_escasas ?? "");
        setFormacionNecesaria(data.formacion_necesaria ?? "");
        setInteresCollege(data.interes_asotoy_college ?? "");
        setComentarios(data.comentarios_adicionales ?? "");
      }
      setLoaded(true);
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formData = {
    cargosDificiles,
    habilidadesEscasas,
    formacionNecesaria,
    interesCollege,
    comentarios,
  };

  const saveToDb = useCallback(
    async (data: typeof formData) => {
      const payload = {
        concesionario_id: concesionarioId,
        cargos_dificiles_cubrir: data.cargosDificiles || null,
        habilidades_escasas: data.habilidadesEscasas || null,
        formacion_necesaria: data.formacionNecesaria || null,
        interes_asotoy_college: data.interesCollege || null,
        comentarios_adicionales: data.comentarios || null,
      };

      if (existingId) {
        await supabase
          .from("necesidades")
          .update(payload)
          .eq("id", existingId);
      } else {
        const { data: inserted } = await supabase
          .from("necesidades")
          .insert(payload)
          .select("id")
          .single();
        if (inserted) setExistingId(inserted.id);
      }
    },
    [concesionarioId, existingId, supabase]
  );

  const { status } = useAutoSave({
    data: formData,
    onSave: saveToDb,
    enabled: !readOnly && loaded,
  });

  async function handleContinue() {
    await saveToDb(formData);
    await markSectionComplete("seccion5");
    router.push("/formulario/confirmacion");
    router.refresh();
  }

  if (!loaded) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Cargando datos...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <SaveIndicator status={status} />
      </div>

      <div className="rounded-xl bg-card border border-border p-6 space-y-5">
        <div className="space-y-2">
          <Label>
            ¿Cuáles son los cargos más difíciles de cubrir?
          </Label>
          <Textarea
            value={cargosDificiles}
            onChange={(e) => setCargosDificiles(e.target.value)}
            placeholder="Ej: Mecánicos especializados, técnicos de diagnóstico..."
            rows={3}
            disabled={readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label>
            ¿Qué habilidades escasean en el mercado?
          </Label>
          <Textarea
            value={habilidadesEscasas}
            onChange={(e) => setHabilidadesEscasas(e.target.value)}
            placeholder="Ej: Electrónica automotriz, diagnóstico computarizado..."
            rows={3}
            disabled={readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label>
            ¿Qué formación necesita el equipo?
          </Label>
          <Textarea
            value={formacionNecesaria}
            onChange={(e) => setFormacionNecesaria(e.target.value)}
            placeholder="Ej: Capacitación en nuevos modelos, atención al cliente..."
            rows={3}
            disabled={readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label>¿Interés en ASOTOY College?</Label>
          <p className="text-xs text-muted-foreground">
            Programa de formación en alianza con la USM
          </p>
          <Select
            value={interesCollege || null}
            onValueChange={(v) => setInteresCollege(v ?? "")}
            disabled={readOnly}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {INTERES_COLLEGE.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Comentarios adicionales</Label>
          <Textarea
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            placeholder="Cualquier información adicional que desee compartir..."
            rows={3}
            disabled={readOnly}
          />
        </div>
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button onClick={handleContinue} className="gap-2">
              Guardar y finalizar
              <ArrowRight size={16} />
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
