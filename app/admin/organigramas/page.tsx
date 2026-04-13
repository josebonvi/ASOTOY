import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Hammer, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import OrganigramasFilterTabs from "./OrganigramasFilterTabs";

const ESTADO_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function OrganigramasAdminPage() {
  const supabase = await createClient();

  const { data: organigramas } = await supabase
    .from("organigramas")
    .select("*, concesionario:concesionarios(nombre, zona, estado)")
    .order("created_at", { ascending: false });

  const items = organigramas ?? [];

  const totalCount = items.length;
  const pendientesCount = items.filter((o) => o.estado === "pendiente").length;
  const enRevisionCount = items.filter((o) => o.estado === "en_revision").length;
  const aprobadosCount = items.filter((o) => o.estado === "aprobado").length;

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Organigramas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cola de organigramas enviados por concesionarios
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <p className="text-xs text-yellow-400">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-400">{pendientesCount}</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-xs text-blue-400">En revisión</p>
          <p className="text-2xl font-bold text-blue-400">{enRevisionCount}</p>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <p className="text-xs text-green-400">Aprobados</p>
          <p className="text-2xl font-bold text-green-400">{aprobadosCount}</p>
        </div>
      </div>

      {/* Filter Tabs + Table */}
      <OrganigramasFilterTabs organigramas={items} estadoConfig={ESTADO_CONFIG} />
    </div>
  );
}
