import { createClient } from "@/lib/supabase/server";
import { FileText } from "lucide-react";
import OrganigramasFilterTabs from "./OrganigramasFilterTabs";

export default async function OrganigramasAdminPage() {
  const supabase = await createClient();

  const { data: organigramas } = await supabase
    .from("organigramas")
    .select("*, concesionario:concesionarios(nombre, zona, estado)")
    .order("created_at", { ascending: false });

  const items = (organigramas ?? []).map((o) => ({
    ...o,
    // Supabase returns the join as an array when not using .single()
    concesionario: Array.isArray(o.concesionario)
      ? o.concesionario[0] ?? null
      : o.concesionario ?? null,
  }));

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
      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Aún no hay organigramas enviados por concesionarios
          </p>
        </div>
      ) : (
        <OrganigramasFilterTabs organigramas={items} />
      )}
    </div>
  );
}
