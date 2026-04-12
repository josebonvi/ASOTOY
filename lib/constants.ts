export const NIVELES_TOYOTA = [
  { value: "ayudante", label: "Ayudante / Pasante", equivalencia: "Pre-G1" },
  { value: "tecnico_g1", label: "Técnico Toyota / G1", equivalencia: "G1 — Entrada certificada" },
  { value: "tecnico_g2", label: "Técnico Profesional / G2", equivalencia: "G2 — Intermedio" },
  { value: "tecnico_g3", label: "Técnico Diagnóstico / G3", equivalencia: "G3 — Avanzado" },
  { value: "tecnico_g4", label: "Técnico Maestro / G4", equivalencia: "G4 — Máximo nivel técnico" },
  { value: "no_aplica", label: "No aplica", equivalencia: "Cargos administrativos del taller" },
] as const;

export const CARGOS_MECANICA = [
  // Técnicos
  { value: "ayudante_mecanica", label: "Ayudante de Mecánica", categoria: "tecnico" },
  { value: "tecnico_g1", label: "Técnico Toyota (G1)", categoria: "tecnico" },
  { value: "tecnico_g2", label: "Técnico Profesional (G2)", categoria: "tecnico" },
  { value: "tecnico_g3", label: "Técnico Diagnóstico (G3)", categoria: "tecnico" },
  { value: "tecnico_g4", label: "Técnico Maestro (G4)", categoria: "tecnico" },
  { value: "tecnico_calidad", label: "Técnico de Calidad", categoria: "tecnico" },
  { value: "tecnico_probador", label: "Técnico Probador", categoria: "tecnico" },
  // Supervisión
  { value: "jefe_taller", label: "Jefe de Taller", categoria: "supervision" },
  { value: "coordinador_servicios", label: "Coordinador de Servicios", categoria: "supervision" },
  { value: "coordinador_admin_mecanica", label: "Coordinador Administrativo de Mecánica", categoria: "supervision" },
  { value: "supervisor_recepcion_citas", label: "Supervisor de Recepción y Citas", categoria: "supervision" },
  { value: "lider_kaizen", label: "Líder Kaizen", categoria: "supervision" },
  // Atención al cliente
  { value: "asesor_servicio", label: "Asesor de Servicio", categoria: "atencion" },
  { value: "asesor_citas", label: "Asesor de Citas", categoria: "atencion" },
  { value: "receptor", label: "Receptor", categoria: "atencion" },
  { value: "recepcionista_taller", label: "Recepcionista del Taller", categoria: "atencion" },
  { value: "atencion_cliente", label: "Atención al Cliente", categoria: "atencion" },
  { value: "asesor_redes_seguros", label: "Asesor de Redes y Seguros", categoria: "atencion" },
  // Soporte operativo
  { value: "analista_garantia", label: "Analista de Garantía", categoria: "soporte" },
  { value: "analista_campanas", label: "Analista de Campañas", categoria: "soporte" },
  { value: "controlista", label: "Controlista", categoria: "soporte" },
  { value: "controlista_express", label: "Controlista Servicios Express", categoria: "soporte" },
  { value: "almacenista", label: "Almacenista", categoria: "soporte" },
  { value: "vendedor_repuestos", label: "Vendedor de Repuestos (Taller)", categoria: "soporte" },
  { value: "chofer", label: "Chofer", categoria: "soporte" },
  // Administrativo
  { value: "analista_programador", label: "Analista Programador (Soporte IT Taller)", categoria: "administrativo" },
] as const;

export const AREAS_TALLER = [
  { value: "taller_mecanica_general", label: "Taller Mecánica General" },
  { value: "taller_mecanica_1", label: "Taller Mecánica I" },
  { value: "taller_mecanica_2", label: "Taller Mecánica II" },
  { value: "taller_express", label: "Taller Express" },
  { value: "recepcion_citas", label: "Recepción y Citas" },
  { value: "admin_mecanica", label: "Administración de Mecánica" },
  { value: "control_calidad", label: "Control de Calidad" },
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
