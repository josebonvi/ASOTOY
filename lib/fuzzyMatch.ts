// Fuzzy matching for mapping dealer cargo names to Toyota standard catalog

interface FuzzyMatchResult {
  catalogoValue: string;
  catalogoLabel: string;
  confidence: number;
  matchType: "exact" | "contains" | "keyword" | "synonym" | "levenshtein";
}

// Synonym map: catalogo_toyota.value → alternative names dealers might use
const SYNONYMS: Record<string, string[]> = {
  tecnico_g4: ["maestro", "master", "senior", "nivel 4", "g-4", "g4", "nivel iv"],
  tecnico_g3: ["diagnostico", "diag", "nivel 3", "g-3", "g3", "nivel iii", "avanzado"],
  tecnico_g2: ["profesional", "intermedio", "nivel 2", "g-2", "g2", "nivel ii"],
  tecnico_g1: ["toyota", "basico", "entrada", "junior", "nivel 1", "g-1", "g1", "nivel i"],
  ayudante_mecanica: ["ayudante", "pasante", "aprendiz", "auxiliar", "helper"],
  jefe_taller: ["gerente taller", "encargado taller", "director taller", "jefe mecanica", "jefe de mecanica"],
  coordinador_servicios: ["coordinador", "coord servicios", "coord. servicios"],
  asesor_servicio: ["asesor", "consultor servicio", "service advisor", "asesor de servicio"],
  asesor_citas: ["citas", "agendamiento", "programador citas"],
  receptor: ["recepcionista", "recepcion", "recepcionista taller"],
  analista_garantia: ["garantia", "garantías", "analista garantías"],
  analista_campanas: ["campañas", "campanas", "recall"],
  controlista: ["controlista", "controller", "control"],
  almacenista: ["almacen", "almacenero", "bodeguero", "warehouse"],
  vendedor_repuestos: ["repuestos", "partes", "parts", "mostrador"],
  chofer: ["conductor", "driver", "chofer"],
  lider_kaizen: ["kaizen", "mejora continua", "lean"],
};

// Toyota technical keywords and their associated catalog values
const TOYOTA_KEYWORDS: Record<string, string> = {
  g1: "tecnico_g1",
  g2: "tecnico_g2",
  g3: "tecnico_g3",
  g4: "tecnico_g4",
  maestro: "tecnico_g4",
  diagnostico: "tecnico_g3",
  profesional: "tecnico_g2",
  kaizen: "lider_kaizen",
  garantia: "analista_garantia",
  campana: "analista_campanas",
  express: "controlista_express",
};

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

interface CatalogoEntry {
  value: string;
  label: string;
}

export function fuzzyMatchCargo(
  dealerName: string,
  catalogo: CatalogoEntry[]
): FuzzyMatchResult[] {
  const results: FuzzyMatchResult[] = [];
  const normalizedDealer = normalize(dealerName);

  for (const entry of catalogo) {
    const normalizedLabel = normalize(entry.label);
    const normalizedValue = normalize(entry.value.replace(/_/g, " "));

    // 1. Exact match
    if (
      normalizedDealer === normalizedLabel ||
      normalizedDealer === normalizedValue
    ) {
      results.push({
        catalogoValue: entry.value,
        catalogoLabel: entry.label,
        confidence: 1.0,
        matchType: "exact",
      });
      continue;
    }

    // 2. Contains match
    if (
      normalizedDealer.includes(normalizedLabel) ||
      normalizedLabel.includes(normalizedDealer)
    ) {
      results.push({
        catalogoValue: entry.value,
        catalogoLabel: entry.label,
        confidence: 0.85,
        matchType: "contains",
      });
      continue;
    }

    // 3. Synonym match
    const synonyms = SYNONYMS[entry.value] || [];
    const synonymMatch = synonyms.some((syn) => {
      const normalizedSyn = normalize(syn);
      return (
        normalizedDealer.includes(normalizedSyn) ||
        normalizedSyn.includes(normalizedDealer)
      );
    });
    if (synonymMatch) {
      results.push({
        catalogoValue: entry.value,
        catalogoLabel: entry.label,
        confidence: 0.75,
        matchType: "synonym",
      });
      continue;
    }

    // 4. Keyword match
    const dealerTokens = normalizedDealer.split(" ");
    for (const token of dealerTokens) {
      if (TOYOTA_KEYWORDS[token] === entry.value) {
        results.push({
          catalogoValue: entry.value,
          catalogoLabel: entry.label,
          confidence: 0.7,
          matchType: "keyword",
        });
        break;
      }
    }

    // 5. Levenshtein distance
    const dist = levenshtein(normalizedDealer, normalizedLabel);
    const maxLen = Math.max(normalizedDealer.length, normalizedLabel.length);
    if (maxLen > 0 && dist / maxLen < 0.3) {
      results.push({
        catalogoValue: entry.value,
        catalogoLabel: entry.label,
        confidence: Math.max(0.3, 1 - dist / maxLen),
        matchType: "levenshtein",
      });
    }
  }

  // Sort by confidence descending, take top results
  return results.sort((a, b) => b.confidence - a.confidence);
}

export function suggestAllMappings(
  dealerCargos: { id: string; nombre: string }[],
  catalogo: CatalogoEntry[]
): Map<string, FuzzyMatchResult | null> {
  const suggestions = new Map<string, FuzzyMatchResult | null>();

  for (const cargo of dealerCargos) {
    const matches = fuzzyMatchCargo(cargo.nombre, catalogo);
    suggestions.set(cargo.id, matches.length > 0 ? matches[0] : null);
  }

  return suggestions;
}
