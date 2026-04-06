import { BarChart3 } from "lucide-react";

export default function ResultadosPage() {
  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold mb-1">Resultados</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Dashboards agregados del estudio de remuneración
      </p>
      <div className="rounded-xl bg-card border border-border p-12 flex flex-col items-center justify-center text-center">
        <BarChart3 size={48} className="text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          Los dashboards de resultados estarán disponibles cuando haya suficiente
          data recolectada.
        </p>
      </div>
    </div>
  );
}
