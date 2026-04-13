// ===== Database row types =====

export interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "dealer";
  created_at: string;
}

export interface FormularioProgreso {
  organigrama: boolean;
  seccion1: boolean;
  seccion2: boolean;
  seccion3: boolean;
  seccion4: boolean;
  seccion5: boolean;
}

export type FormularioEstado = "pendiente" | "en_progreso" | "completado";

export type OrganigramaEstado = "no_iniciado" | "pendiente" | "en_revision" | "aprobado";

export interface Concesionario {
  id: string;
  nombre: string;
  zona: string | null;
  estado: string | null;
  ciudad: string | null;
  num_empleados: number | null;
  tiene_organigrama: boolean | null;
  cadena_mando: string | null;
  responsable_nombre: string | null;
  responsable_email: string | null;
  responsable_telefono: string | null;
  user_id: string | null;
  organigrama_estado: OrganigramaEstado;
  formulario_estado: FormularioEstado;
  formulario_progreso: FormularioProgreso;
  created_at: string;
  updated_at: string;
}

export interface Area {
  id: string;
  concesionario_id: string;
  nombre_area: string;
  num_personas: number | null;
  created_at: string;
}

export type NivelToyota =
  | "tecnico_g1"
  | "tecnico_g2"
  | "tecnico_g3"
  | "tecnico_g4"
  | "asesor_servicio"
  | "asesor_tecnico"
  | "jefe_taller"
  | "analista_garantia"
  | "ayudante"
  | "no_aplica";

export interface Cargo {
  id: string;
  concesionario_id: string;
  nombre_cargo: string;
  area: string | null;
  nivel_toyota: NivelToyota | null;
  nivel_interno: string | null;
  certificado_toyota: boolean;
  num_personas: number | null;
  es_cargo_rotacion: boolean;
  motivo_rotacion: string | null;
  dificultad_cubrir: number | null;
  organigrama_cargo_id: string | null;
  nombre_cargo_dealer: string | null;
  pre_populated: boolean;
  created_at: string;
}

export type Moneda = "USD" | "VES" | "mixto";
export type TipoPago = "fijo" | "variable" | "mixto";
export type FrecuenciaRevision =
  | "mensual"
  | "trimestral"
  | "semestral"
  | "anual"
  | "sin_frecuencia";

export interface RangoSalarial {
  id: string;
  concesionario_id: string;
  cargo_id: string;
  moneda: Moneda;
  salario_min: number | null;
  salario_max: number | null;
  tipo_pago: TipoPago | null;
  tiene_comisiones: boolean;
  descripcion_comisiones: string | null;
  tiene_bonos: boolean;
  descripcion_bonos: string | null;
  frecuencia_revision: FrecuenciaRevision | null;
  created_at: string;
}

export type EducacionMinima =
  | "bachiller"
  | "tecnico"
  | "universitario"
  | "postgrado"
  | "no_requerido";

export interface PerfilTalento {
  id: string;
  concesionario_id: string;
  cargo_id: string;
  educacion_minima: EducacionMinima | null;
  certificacion_toyota_suficiente: boolean;
  formacion_adicional: string | null;
  experiencia_minima_anios: number | null;
  habilidades_clave: string | null;
  habilidades_faltantes: string | null;
  created_at: string;
}

export type InteresCollege = "si" | "no" | "tal_vez";

export interface Necesidad {
  id: string;
  concesionario_id: string;
  cargos_dificiles_cubrir: string | null;
  habilidades_escasas: string | null;
  formacion_necesaria: string | null;
  interes_asotoy_college: InteresCollege | null;
  comentarios_adicionales: string | null;
  created_at: string;
}

// ===== Form input types (for React Hook Form) =====

export interface AreaInput {
  nombre_area: string;
  num_personas: number | null;
}

export interface Seccion1Form {
  nombre: string;
  zona: string;
  estado: string;
  ciudad: string;
  num_empleados: number;
  tiene_organigrama: boolean;
  cadena_mando: string;
  areas: AreaInput[];
}

export interface CargoInput {
  id?: string;
  nombre_cargo: string;
  area: string;
  nivel_toyota: NivelToyota;
  nivel_interno: string;
  num_personas: number | null;
  certificado_toyota: boolean;
}

export interface Seccion2Form {
  cargos: CargoInput[];
  evaluaciones_toyota_afectan: boolean;
  evaluaciones_toyota_detalle: string;
  cargos_rotacion_ids: string[];
  motivo_rotacion: string;
}

export interface RangoSalarialInput {
  cargo_id: string;
  cargo_nombre: string;
  salario_min: number | null;
  salario_max: number | null;
  tipo_pago: TipoPago;
  moneda: Moneda;
}

export interface Seccion3Form {
  moneda_principal: Moneda;
  rangos: RangoSalarialInput[];
  tiene_comisiones: boolean;
  descripcion_comisiones: string;
  tiene_bonos: boolean;
  descripcion_bonos: string;
  frecuencia_revision: FrecuenciaRevision;
}

export interface PerfilTalentoInput {
  cargo_id: string;
  cargo_nombre: string;
  educacion_minima: EducacionMinima;
  certificacion_toyota_suficiente: boolean;
  formacion_adicional: string;
  experiencia_minima_anios: number | null;
  habilidades_clave: string;
}

export interface Seccion4Form {
  perfiles: PerfilTalentoInput[];
  habilidades_faltantes: string;
}

export interface Seccion5Form {
  cargos_dificiles_cubrir: string;
  habilidades_escasas: string;
  formacion_necesaria: string;
  interes_asotoy_college: InteresCollege;
  comentarios_adicionales: string;
}

// ===== Organigrama DB row types =====

export interface CatalogoToyota {
  id: string;
  value: string;
  label: string;
  categoria: string;
  nivel_toyota_default: string | null;
  orden: number;
  activo: boolean;
  created_at: string;
}

export interface Organigrama {
  id: string;
  concesionario_id: string;
  tipo: "upload" | "builder" | "legacy";
  estado: "pendiente" | "en_revision" | "aprobado" | "rechazado";
  archivo_url: string | null;
  archivo_nombre: string | null;
  archivo_tipo: string | null;
  notas_concesionario: string | null;
  notas_admin: string | null;
  aprobado_por: string | null;
  aprobado_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganigramaCargo {
  id: string;
  organigrama_id: string;
  concesionario_id: string;
  nombre_cargo_dealer: string;
  departamento: string | null;
  num_personas: number;
  orden: number;
  created_at: string;
}

export interface OrganigramaMapping {
  id: string;
  organigrama_cargo_id: string;
  catalogo_toyota_id: string | null;
  nombre_cargo_estandar: string | null;
  nivel_toyota_sugerido: string | null;
  confianza_match: number | null;
  es_auto_match: boolean;
  confirmado_por_admin: boolean;
  created_at: string;
}

// ===== Organigrama form input types =====

export interface OrganigramaCargoInput {
  nombre_cargo_dealer: string;
  departamento: string;
  num_personas: number;
  orden: number;
}

export interface OrganigramaDepartamento {
  nombre: string;
  cargos: OrganigramaCargoInput[];
}
