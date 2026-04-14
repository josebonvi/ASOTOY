"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, AlertCircle } from "lucide-react";

interface SaveIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
}

export function SaveIndicator({ status }: SaveIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === "saving" || status === "error") {
      setVisible(true);
    } else if (status === "saved") {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [status]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border shadow-lg text-sm"
        >
          {status === "saving" && (
            <>
              <Loader2 size={14} className="animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Guardando...</span>
            </>
          )}
          {status === "saved" && (
            <>
              <Check size={14} className="text-green-500" />
              <span className="text-green-500">Guardado</span>
            </>
          )}
          {status === "error" && (
            <>
              <AlertCircle size={14} className="text-destructive" />
              <span className="text-destructive">Error al guardar</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
