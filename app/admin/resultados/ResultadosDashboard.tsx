"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Users,
  Briefcase,
  Building2,
  Award,
  GraduationCap,
  AlertTriangle,
} from "lucide-react";

// --- Types ---

interface KPIData {
  totalPersonas: number;
  totalCargos: number;
  concesionariosCompletos: number;
  concesionariosPendientes: number;
  pctCertificacion: number;
}

interface NivelToyotaItem {
  nivel: string;
  personas: number;
}

interface ZonaItem {
  zona: string;
  personas: number;
  cargos: number;
}

interface SalarioNivelItem {
  nivel: string;
  salario_min_avg: number;
  salario_max_avg: number;
}

interface CertificacionItem {
  concesionario: string;
  pct: number;
}

interface NecesidadesData {
  cargosDificiles: string[];
  habilidadesEscasas: string[];
  formacionNecesaria: string[];
  interesCollege: { si: number; no: number; tal_vez: number };
}

interface ExperienciaNivelItem {
  nivel: string;
  experiencia_avg: number;
}

interface EducacionItem {
  educacion: string;
  cantidad: number;
}

export interface DashboardData {
  kpis: KPIData;
  nivelToyota: NivelToyotaItem[];
  zonas: ZonaItem[];
  salariosPorNivel: SalarioNivelItem[];
  certificacionPorConc: CertificacionItem[];
  necesidades: NecesidadesData;
  experienciaPorNivel: ExperienciaNivelItem[];
  educacionDist: EducacionItem[];
}

// --- Colors ---

const COLORS = {
  red: "#CC0000",
  redLight: "#FF3333",
  green: "#22C55E",
  amber: "#F59E0B",
  blue: "#3B82F6",
  purple: "#A855F7",
  cyan: "#06B6D4",
  pink: "#EC4899",
};

const PIE_COLORS = [
  COLORS.red,
  COLORS.blue,
  COLORS.green,
  COLORS.amber,
  COLORS.purple,
  COLORS.cyan,
  COLORS.pink,
];

const COLLEGE_COLORS: Record<string, string> = {
  si: COLORS.green,
  no: COLORS.red,
  tal_vez: COLORS.amber,
};

// --- Animation variants ---

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// --- Custom tooltip ---

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-card/90 backdrop-blur-lg border border-white/10 px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString("es-VE") : p.value}
        </p>
      ))}
    </div>
  );
}

// --- Empty state ---

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <AlertTriangle size={32} className="text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// --- KPI Card ---

function KPICard({
  label,
  value,
  icon: Icon,
  suffix,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  suffix?: string;
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="h-full border-t-2 border-t-primary shadow-sm">
        <CardContent className="pt-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <Icon size={16} className="text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            {value}
            {suffix && (
              <span className="text-lg text-muted-foreground ml-1">
                {suffix}
              </span>
            )}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- Main Component ---

export default function ResultadosDashboard({
  data,
}: {
  data: DashboardData;
}) {
  const {
    kpis,
    nivelToyota,
    zonas,
    salariosPorNivel,
    certificacionPorConc,
    necesidades,
    experienciaPorNivel,
    educacionDist,
  } = data;

  const hasSalaryData = salariosPorNivel.some(
    (s) => s.salario_min_avg > 0 || s.salario_max_avg > 0
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Section 1: KPIs */}
      <section>
        <motion.h2
          variants={itemVariants}
          className="text-lg font-semibold mb-4"
        >
          Resumen General
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total personas en la red"
            value={kpis.totalPersonas.toLocaleString("es-VE")}
            icon={Users}
          />
          <KPICard
            label="Cargos registrados"
            value={kpis.totalCargos.toLocaleString("es-VE")}
            icon={Briefcase}
          />
          <KPICard
            label="Concesionarios completos"
            value={`${kpis.concesionariosCompletos} / ${kpis.concesionariosCompletos + kpis.concesionariosPendientes}`}
            icon={Building2}
          />
          <KPICard
            label="Certificacion Toyota"
            value={kpis.pctCertificacion}
            icon={Award}
            suffix="%"
          />
        </div>
      </section>

      {/* Section 2: Nivel Toyota */}
      <motion.section variants={itemVariants}>
        <Card className="border-t-2 border-t-primary shadow-sm">
          <CardHeader>
            <CardTitle>Distribucion por Nivel Toyota</CardTitle>
            <CardDescription>
              Cantidad de personas en cada nivel de certificacion
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nivelToyota.length === 0 ? (
              <EmptyState message="No hay suficiente data de niveles Toyota." />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={nivelToyota}>
                  <defs>
                    <linearGradient
                      id="barGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={COLORS.red} stopOpacity={1} />
                      <stop
                        offset="100%"
                        stopColor={COLORS.red}
                        stopOpacity={0.6}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="nivel"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="personas"
                    name="Personas"
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                    animationDuration={800}
                    animationEasing="ease-out"
                    activeBar={{ fill: "#FF3333", fillOpacity: 1 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* Section 3: Zonas */}
      <motion.section variants={itemVariants}>
        <Card className="border-t-2 border-t-primary shadow-sm">
          <CardHeader>
            <CardTitle>Distribucion por Zona</CardTitle>
            <CardDescription>
              Personas y cargos por zona geografica
            </CardDescription>
          </CardHeader>
          <CardContent>
            {zonas.length === 0 ? (
              <EmptyState message="No hay suficiente data de zonas." />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie chart */}
                <div>
                  <p className="text-xs text-muted-foreground text-center mb-2">
                    Personas por zona
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={20} fontWeight="bold">
                        {zonas.reduce((s, z) => s + z.personas, 0).toLocaleString("es-VE")}
                      </text>
                      <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize={10}>
                        personas
                      </text>
                      <Pie
                        data={zonas}
                        dataKey="personas"
                        nameKey="zona"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                        paddingAngle={3}
                        animationDuration={800}
                        animationEasing="ease-out"
                        label={({ name, percent }: { name?: string; percent?: number }) =>
                          `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                      >
                        {zonas.map((_, i) => (
                          <Cell
                            key={i}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Bar chart */}
                <div>
                  <p className="text-xs text-muted-foreground text-center mb-2">
                    Cargos por zona
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={zonas} layout="vertical">
                      <XAxis
                        type="number"
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="zona"
                        width={80}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="cargos"
                        name="Cargos"
                        fill={COLORS.blue}
                        radius={[0, 6, 6, 0]}
                        animationDuration={800}
                        animationEasing="ease-out"
                        activeBar={{ fill: "#60A5FA", fillOpacity: 1 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* Section 4: Comparativa Salarial */}
      {hasSalaryData && (
        <motion.section variants={itemVariants}>
          <Card className="border-t-2 border-t-primary shadow-sm">
            <CardHeader>
              <CardTitle>Comparativa Salarial por Nivel Toyota</CardTitle>
              <CardDescription>
                Promedio de salario minimo y maximo por nivel (USD)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={salariosPorNivel}>
                  <XAxis
                    dataKey="nivel"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${v.toLocaleString()}`}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    formatter={(value: unknown) => `$${Number(value).toLocaleString()}`}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
                  />
                  <Bar
                    dataKey="salario_min_avg"
                    name="Salario Min (Prom.)"
                    fill={COLORS.blue}
                    radius={[6, 6, 0, 0]}
                    animationDuration={800}
                    animationEasing="ease-out"
                    activeBar={{ fill: "#60A5FA", fillOpacity: 1 }}
                  />
                  <Bar
                    dataKey="salario_max_avg"
                    name="Salario Max (Prom.)"
                    fill={COLORS.green}
                    radius={[6, 6, 0, 0]}
                    animationDuration={800}
                    animationEasing="ease-out"
                    activeBar={{ fill: "#4ADE80", fillOpacity: 1 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* Section 5: Certificacion por Concesionario */}
      <motion.section variants={itemVariants}>
        <Card className="border-t-2 border-t-primary shadow-sm">
          <CardHeader>
            <CardTitle>Certificacion Toyota por Concesionario</CardTitle>
            <CardDescription>
              Porcentaje de cargos con certificacion Toyota
            </CardDescription>
          </CardHeader>
          <CardContent>
            {certificacionPorConc.length === 0 ? (
              <EmptyState message="No hay suficiente data de certificaciones." />
            ) : (
              <ResponsiveContainer
                width="100%"
                height={Math.max(300, certificacionPorConc.length * 40)}
              >
                <BarChart data={certificacionPorConc} layout="vertical">
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="concesionario"
                    width={150}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    formatter={(value: unknown) => `${Number(value).toFixed(1)}%`}
                  />
                  <Bar
                    dataKey="pct"
                    name="% Certificados"
                    fill={COLORS.amber}
                    radius={[0, 6, 6, 0]}
                    background={{ fill: "rgba(255,255,255,0.05)", radius: 6 }}
                    animationDuration={800}
                    animationEasing="ease-out"
                    activeBar={{ fill: "#FBBF24", fillOpacity: 1 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* Section 6: Necesidades */}
      <motion.section variants={itemVariants}>
        <Card className="border-t-2 border-t-primary shadow-sm">
          <CardHeader>
            <CardTitle>Necesidades de la Red</CardTitle>
            <CardDescription>
              Tendencias identificadas por los concesionarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            {necesidades.cargosDificiles.length === 0 &&
            necesidades.habilidadesEscasas.length === 0 &&
            necesidades.formacionNecesaria.length === 0 ? (
              <EmptyState message="No hay suficiente data de necesidades." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Cargos dificiles */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-red-400">
                    Cargos dificiles de cubrir
                  </h4>
                  {necesidades.cargosDificiles.length > 0 ? (
                    <ul className="space-y-1.5">
                      {necesidades.cargosDificiles.map((c, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sin data</p>
                  )}
                </div>

                {/* Habilidades escasas */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-amber-400">
                    Habilidades escasas
                  </h4>
                  {necesidades.habilidadesEscasas.length > 0 ? (
                    <ul className="space-y-1.5">
                      {necesidades.habilidadesEscasas.map((h, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sin data</p>
                  )}
                </div>

                {/* Formacion necesaria */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-blue-400">
                    Formacion necesaria
                  </h4>
                  {necesidades.formacionNecesaria.length > 0 ? (
                    <ul className="space-y-1.5">
                      {necesidades.formacionNecesaria.map((f, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sin data</p>
                  )}
                </div>
              </div>
            )}

            {/* ASOTOY College interest */}
            {(necesidades.interesCollege.si > 0 ||
              necesidades.interesCollege.no > 0 ||
              necesidades.interesCollege.tal_vez > 0) && (
              <div className="mt-8 pt-6 border-t border-border">
                <h4 className="text-sm font-semibold mb-4">
                  Interes en ASOTOY College
                </h4>
                <div className="flex flex-wrap gap-6">
                  {(
                    [
                      { key: "si", label: "Si" },
                      { key: "tal_vez", label: "Tal vez" },
                      { key: "no", label: "No" },
                    ] as const
                  ).map(({ key, label }) => {
                    const total =
                      necesidades.interesCollege.si +
                      necesidades.interesCollege.no +
                      necesidades.interesCollege.tal_vez;
                    const val = necesidades.interesCollege[key];
                    const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLLEGE_COLORS[key] }}
                        />
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">
                            {val} ({pct}%)
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* Section 7: Perfil de Talento */}
      <motion.section variants={itemVariants}>
        <Card className="border-t-2 border-t-primary shadow-sm">
          <CardHeader>
            <CardTitle>Perfil de Talento</CardTitle>
            <CardDescription>
              Experiencia y educacion de los perfiles requeridos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {experienciaPorNivel.length === 0 && educacionDist.length === 0 ? (
              <EmptyState message="No hay suficiente data de perfiles." />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Experience bar */}
                <div>
                  <p className="text-xs text-muted-foreground text-center mb-2">
                    Experiencia promedio por nivel (anios)
                  </p>
                  {experienciaPorNivel.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={experienciaPorNivel}>
                        <XAxis
                          dataKey="nivel"
                          tick={{ fill: "#94a3b8", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#94a3b8", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="experiencia_avg"
                          name="Anios promedio"
                          fill={COLORS.purple}
                          radius={[6, 6, 0, 0]}
                          animationDuration={800}
                          animationEasing="ease-out"
                          activeBar={{ fill: "#C084FC", fillOpacity: 1 }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="Sin data de experiencia." />
                  )}
                </div>

                {/* Education pie */}
                <div>
                  <p className="text-xs text-muted-foreground text-center mb-2 flex items-center justify-center gap-1.5">
                    <GraduationCap size={14} />
                    Distribucion de educacion minima
                  </p>
                  {educacionDist.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={18} fontWeight="bold">
                          {educacionDist.reduce((s, e) => s + e.cantidad, 0)}
                        </text>
                        <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize={10}>
                          perfiles
                        </text>
                        <Pie
                          data={educacionDist}
                          dataKey="cantidad"
                          nameKey="educacion"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={45}
                          paddingAngle={3}
                          animationDuration={800}
                          animationEasing="ease-out"
                          label={({ name, percent }: { name?: string; percent?: number }) =>
                            `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`
                          }
                          labelLine={false}
                        >
                          {educacionDist.map((_, i) => (
                            <Cell
                              key={i}
                              fill={PIE_COLORS[i % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="Sin data de educacion." />
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>
    </motion.div>
  );
}
