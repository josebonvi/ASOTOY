"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressStepperProps {
  currentSection: number; // 0=organigrama, 1-5=secciones
  progreso: {
    organigrama: boolean;
    seccion1: boolean;
    seccion2: boolean;
    seccion3: boolean;
    seccion4: boolean;
    seccion5: boolean;
  };
}

const steps = [
  { id: 0, key: "organigrama" as const, label: "Organigrama" },
  { id: 1, key: "seccion1" as const, label: "Datos" },
  { id: 2, key: "seccion2" as const, label: "Cargos" },
  { id: 3, key: "seccion3" as const, label: "Salarios" },
  { id: 4, key: "seccion4" as const, label: "Talento" },
  { id: 5, key: "seccion5" as const, label: "Necesidades" },
];

export function ProgressStepper({ currentSection, progreso }: ProgressStepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = progreso[step.key];
          const isCurrent = step.id === currentSection;
          const isFuture = !isCompleted && !isCurrent;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isCompleted && !isCurrent
                      ? "rgba(34, 197, 94, 0.15)"
                      : isCurrent
                        ? "rgba(204, 0, 0, 0.15)"
                        : "transparent",
                  }}
                  transition={{
                    duration: 0.3,
                    ease: [0.23, 1, 0.32, 1]
                  }}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    isCurrent && "border-2 border-primary text-primary",
                    isCompleted && !isCurrent && "text-success",
                    isFuture && "border border-muted-foreground/30 text-muted-foreground/50"
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                    >
                      <Check className="w-4 h-4 text-success" />
                    </motion.div>
                  ) : (
                    <span>{step.id === 0 ? "O" : step.id}</span>
                  )}
                </motion.div>
                {/* Label - hidden on mobile */}
                <span
                  className={cn(
                    "hidden sm:block mt-2 text-xs font-medium text-center transition-colors duration-300",
                    isCurrent && "text-primary",
                    isCompleted && !isCurrent && "text-success",
                    isFuture && "text-muted-foreground/50"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: isCompleted
                      ? "rgba(34, 197, 94, 0.4)"
                      : "var(--border)"
                  }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 h-0.5 mx-2 sm:mx-3"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
