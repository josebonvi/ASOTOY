"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";

export interface ColumnConfig {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "toggle";
  placeholder?: string;
  options?: { value: string; label: string }[];
  readOnly?: boolean;
  width?: string;
}

interface DynamicTableProps {
  columns: ColumnConfig[];
  data: Record<string, unknown>[];
  onChange: (data: Record<string, unknown>[]) => void;
  minRows?: number;
  addLabel?: string;
}

export function DynamicTable({
  columns,
  data,
  onChange,
  minRows = 1,
  addLabel = "Agregar fila",
}: DynamicTableProps) {
  function addRow() {
    const newRow: Record<string, unknown> = {};
    columns.forEach((col) => {
      if (col.type === "number") newRow[col.key] = null;
      else if (col.type === "toggle") newRow[col.key] = false;
      else newRow[col.key] = "";
    });
    onChange([...data, newRow]);
  }

  function removeRow(index: number) {
    if (data.length <= minRows) return;
    const updated = data.filter((_, i) => i !== index);
    onChange(updated);
  }

  function updateRow(index: number, key: string, value: unknown) {
    const updated = data.map((row, i) =>
      i === index ? { ...row, [key]: value } : row
    );
    onChange(updated);
  }

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {data.map((row, index) => (
                <motion.tr
                  key={index}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-2 py-1.5">
                      {col.readOnly ? (
                        <span className="text-sm text-muted-foreground">
                          {String(row[col.key] ?? "")}
                        </span>
                      ) : col.type === "select" ? (
                        <Select
                          value={String(row[col.key] ?? "") || null}
                          onValueChange={(v) =>
                            updateRow(index, col.key, v ?? "")
                          }
                        >
                          <SelectTrigger className="w-full h-8" size="sm">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {col.options
                              ?.filter((opt) => !opt.value.startsWith("__header_"))
                              .map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      ) : col.type === "toggle" ? (
                        <input
                          type="checkbox"
                          checked={Boolean(row[col.key])}
                          onChange={(e) =>
                            updateRow(index, col.key, e.target.checked)
                          }
                          title={col.label}
                          aria-label={col.label}
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                      ) : (
                        <Input
                          type={col.type}
                          value={
                            row[col.key] === null || row[col.key] === undefined
                              ? ""
                              : String(row[col.key])
                          }
                          onChange={(e) =>
                            updateRow(
                              index,
                              col.key,
                              col.type === "number"
                                ? e.target.value === ""
                                  ? null
                                  : Number(e.target.value)
                                : e.target.value
                            )
                          }
                          placeholder={col.placeholder}
                          className="h-8 text-sm"
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-1">
                    {data.length > minRows && (
                      <button
                        onClick={() => removeRow(index)}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        type="button"
                        title="Eliminar fila"
                        aria-label="Eliminar fila"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {data.map((row, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg bg-accent/30 border border-border p-4 space-y-3"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground">
                  Fila {index + 1}
                </span>
                {data.length > minRows && (
                  <button
                    onClick={() => removeRow(index)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive"
                    type="button"
                    title="Eliminar fila"
                    aria-label="Eliminar fila"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {columns.map((col) => (
                <div key={col.key}>
                  <label className="block text-xs text-muted-foreground mb-1">
                    {col.label}
                  </label>
                  {col.readOnly ? (
                    <span className="text-sm">{String(row[col.key] ?? "")}</span>
                  ) : col.type === "select" ? (
                    <Select
                      value={String(row[col.key] ?? "") || null}
                      onValueChange={(v) =>
                        updateRow(index, col.key, v ?? "")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {col.options?.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : col.type === "toggle" ? (
                    <input
                      type="checkbox"
                      checked={Boolean(row[col.key])}
                      onChange={(e) =>
                        updateRow(index, col.key, e.target.checked)
                      }
                      title={col.label}
                      aria-label={col.label}
                      className="h-5 w-5 rounded border-border accent-primary"
                    />
                  ) : (
                    <Input
                      type={col.type}
                      value={
                        row[col.key] === null || row[col.key] === undefined
                          ? ""
                          : String(row[col.key])
                      }
                      onChange={(e) =>
                        updateRow(
                          index,
                          col.key,
                          col.type === "number"
                            ? e.target.value === ""
                              ? null
                              : Number(e.target.value)
                            : e.target.value
                        )
                      }
                      placeholder={col.placeholder}
                    />
                  )}
                </div>
              ))}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add row button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
        className="mt-3"
      >
        <Plus size={14} className="mr-1.5" />
        {addLabel}
      </Button>
    </div>
  );
}
