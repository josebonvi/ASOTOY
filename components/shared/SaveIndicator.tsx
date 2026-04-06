"use client";

import { Check, Loader2, AlertCircle } from "lucide-react";

interface SaveIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
}

export function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === "idle") return null;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {status === "saving" && (
        <>
          <Loader2 size={12} className="animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Guardando...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check size={12} className="text-success" />
          <span className="text-success">Guardado</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle size={12} className="text-destructive" />
          <span className="text-destructive">Error al guardar</span>
        </>
      )}
    </div>
  );
}
