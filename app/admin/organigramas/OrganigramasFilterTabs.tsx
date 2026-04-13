"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  FileText,
  Hammer,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Organigrama {
  id: string;
  concesionario_id: string;
  tipo: string;
  estado: string;
  archivo_url: string | null;
  archivo_nombre: string | null;
  notas_concesionario: string | null;
  notas_admin: string | null;
  created_at: string;
  concesionario: {
    nombre: string;
    zona: string | null;
    estado: string | null;
  } | null;
}

const ESTADO_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ElementType }
> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    icon: Clock,
  },
  en_revision: {
    label: "En revisión",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: AlertCircle,
  },
  aprobado: {
    label: "Aprobado",
    className: "bg-green-500/15 text-green-400 border-green-500/30",
    icon: CheckCircle2,
  },
  rechazado: {
    label: "Rechazado",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
    icon: XCircle,
  },
};

const TABS = [
  { key: "todos", label: "Todos" },
  { key: "pendiente", label: "Pendientes" },
  { key: "en_revision", label: "En revisión" },
  { key: "aprobado", label: "Aprobados" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrganigramasFilterTabs({
  organigramas,
}: {
  organigramas: Organigrama[];
}) {
  const [activeTab, setActiveTab] = useState("todos");

  const filtered =
    activeTab === "todos"
      ? organigramas
      : organigramas.filter((o) => o.estado === activeTab);

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 rounded-lg bg-secondary/30 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No hay organigramas en esta categoría
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                    Concesionario
                  </th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                    Tipo
                  </th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                    Estado
                  </th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                    Fecha de envío
                  </th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((org) => {
                  const config = ESTADO_CONFIG[org.estado] ?? {
                    label: org.estado,
                    className: "bg-muted text-muted-foreground",
                    icon: AlertCircle,
                  };
                  const EstadoIcon = config.icon;
                  const TipoIcon = org.tipo === "upload" ? FileText : Hammer;

                  return (
                    <tr
                      key={org.id}
                      className="border-b border-border last:border-0 hover:bg-secondary/10 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium">
                          {org.concesionario?.nombre ?? "—"}
                        </p>
                        {org.concesionario?.zona && (
                          <p className="text-xs text-muted-foreground">
                            {org.concesionario.zona}
                            {org.concesionario.estado
                              ? ` — ${org.concesionario.estado}`
                              : ""}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className="gap-1 text-xs font-normal"
                        >
                          <TipoIcon className="h-3 w-3" />
                          {org.tipo === "upload" ? "Archivo" : "Constructor"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={cn(
                            "gap-1 text-xs font-normal border",
                            config.className
                          )}
                        >
                          <EstadoIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatDate(org.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/organigramas/${org.id}`}>
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <Eye className="h-3.5 w-3.5" />
                            Revisar
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
