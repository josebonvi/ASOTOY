import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrganigramaProcessingClient from "./OrganigramaProcessingClient";

export default async function OrganigramaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. The organigrama with concesionario info
  const { data: organigrama } = await supabase
    .from("organigramas")
    .select("*, concesionario:concesionarios(id, nombre, zona, estado)")
    .eq("id", id)
    .single();

  if (!organigrama) notFound();

  // 2. The cargos from the organigrama
  const { data: orgCargos } = await supabase
    .from("organigrama_cargos")
    .select("*")
    .eq("organigrama_id", id)
    .order("orden");

  const cargos = orgCargos ?? [];

  // 3. Existing mappings
  const { data: mappings } = await supabase
    .from("organigrama_mappings")
    .select("*, catalogo:catalogo_toyota(*)")
    .in(
      "organigrama_cargo_id",
      cargos.map((c) => c.id)
    );

  // 4. Full Toyota catalog
  const { data: catalogo } = await supabase
    .from("catalogo_toyota")
    .select("*")
    .eq("activo", true)
    .order("orden");

  return (
    <div className="max-w-7xl">
      <Link href="/admin/organigramas">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 text-muted-foreground"
        >
          <ArrowLeft size={16} className="mr-2" />
          Volver a organigramas
        </Button>
      </Link>

      <OrganigramaProcessingClient
        organigrama={organigrama}
        orgCargos={cargos}
        existingMappings={mappings ?? []}
        catalogo={catalogo ?? []}
      />
    </div>
  );
}
