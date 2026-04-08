export const NIVELES_TOYOTA = [
  { value: "tecnico_g1", label: "Técnico G1" },
  { value: "tecnico_g2", label: "Técnico G2" },
  { value: "tecnico_g3", label: "Técnico G3" },
  { value: "tecnico_g4", label: "Técnico G4" },
  { value: "asesor_servicio", label: "Asesor de Servicio" },
  { value: "asesor_tecnico", label: "Asesor Técnico" },
  { value: "jefe_taller", label: "Jefe de Taller" },
  { value: "analista_garantia", label: "Analista de Garantía" },
  { value: "no_aplica", label: "No aplica (cargo no definido por Toyota)" },
] as const;

export const ESTADOS_VENEZUELA = [
  "Amazonas",
  "Anzoátegui",
  "Apure",
  "Aragua",
  "Barinas",
  "Bolívar",
  "Carabobo",
  "Cojedes",
  "Delta Amacuro",
  "Distrito Capital",
  "Falcón",
  "Guárico",
  "La Guaira",
  "Lara",
  "Mérida",
  "Miranda",
  "Monagas",
  "Nueva Esparta",
  "Portuguesa",
  "Sucre",
  "Táchira",
  "Trujillo",
  "Yaracuy",
  "Zulia",
] as const;

export const MONEDAS = [
  { value: "USD", label: "Dólares (USD)" },
  { value: "VES", label: "Bolívares (VES)" },
  { value: "mixto", label: "Mixto (USD + VES)" },
] as const;

export const TIPOS_PAGO = [
  { value: "fijo", label: "Fijo" },
  { value: "variable", label: "Variable" },
  { value: "mixto", label: "Mixto" },
] as const;

export const EDUCACION_MINIMA = [
  { value: "no_requerido", label: "No requerido" },
  { value: "bachiller", label: "Bachiller" },
  { value: "tecnico", label: "Técnico Superior" },
  { value: "universitario", label: "Universitario" },
  { value: "postgrado", label: "Postgrado" },
] as const;

export const FRECUENCIA_REVISION = [
  { value: "mensual", label: "Mensual" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
  { value: "sin_frecuencia", label: "Sin frecuencia definida" },
] as const;

export const INTERES_COLLEGE = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
  { value: "tal_vez", label: "Tal vez" },
] as const;

export const FORMULARIO_SECCIONES = [
  {
    id: 1,
    key: "seccion1" as const,
    titulo: "Datos del Concesionario",
    icono: "Building2",
    requiere: null,
  },
  {
    id: 2,
    key: "seccion2" as const,
    titulo: "Clasificación de Cargos",
    icono: "Users",
    requiere: null,
  },
  {
    id: 3,
    key: "seccion3" as const,
    titulo: "Rangos de Remuneración",
    icono: "DollarSign",
    requiere: "seccion2" as const,
  },
  {
    id: 4,
    key: "seccion4" as const,
    titulo: "Perfil del Talento",
    icono: "GraduationCap",
    requiere: "seccion2" as const,
  },
  {
    id: 5,
    key: "seccion5" as const,
    titulo: "Necesidades y Brechas",
    icono: "Target",
    requiere: null,
  },
] as const;

export const CONCESIONARIOS_PILOTO = [
  { nombre: "Mariperez Motors", zona: "Central", estado: "Distrito Capital" },
  { nombre: "CARS", zona: "Central", estado: "Distrito Capital" },
  { nombre: "Tomás Felipe", zona: "Central", estado: "Distrito Capital" },
] as const;

/** Helper: obtener label legible de un valor de nivel_toyota */
export function getNivelToyotaLabel(value: string | null): string {
  if (!value) return "—";
  const found = NIVELES_TOYOTA.find((n) => n.value === value);
  return found?.label ?? value;
}
