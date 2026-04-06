import { Download } from "lucide-react";

export default function ExportarPage() {
  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold mb-1">Exportar</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Descarga la data recolectada en formato Excel
      </p>
      <div className="rounded-xl bg-card border border-border p-12 flex flex-col items-center justify-center text-center">
        <Download size={48} className="text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          La exportación estará disponible cuando haya data completada.
        </p>
      </div>
    </div>
  );
}
