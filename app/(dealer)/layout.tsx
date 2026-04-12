import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DealerSidebar from "@/components/layout/DealerSidebar";
import type { FormularioProgreso } from "@/lib/types";

export default async function DealerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: concesionario } = await supabase
    .from("concesionarios")
    .select("nombre, formulario_progreso")
    .eq("user_id", user.id)
    .single();

  if (!concesionario) redirect("/login");

  const progreso = (concesionario.formulario_progreso as FormularioProgreso) ?? {
    seccion1: false,
    seccion2: false,
    seccion3: false,
    seccion4: false,
    seccion5: false,
  };

  return (
    <div className="flex h-full min-h-screen bg-background">
      <DealerSidebar
        concesionarioNombre={concesionario.nombre}
        progreso={progreso}
      />
      <main className="flex-1 md:ml-64 p-4 pt-16 md:pt-6 md:p-6 overflow-auto">{children}</main>
    </div>
  );
}
