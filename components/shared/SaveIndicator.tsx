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
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{
            duration: 0.25,
            ease: [0.25, 0.1, 0.25, 1]
          }}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border shadow-lg text-sm"
        >
          {status === "saving" && (
            <>
              <Loader2 size={14} className="animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Guardando...</span>
            </>
          )}
          {status === "saved" && (
            <motion.div
              className="flex items-center gap-2"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
            >
              <Check size={14} className="text-green-500" />
              <span className="text-green-500">Guardado</span>
            </motion.div>
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
