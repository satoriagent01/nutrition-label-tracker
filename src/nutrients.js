// Pure nutrient catalog and value helpers.
// Everything platform-specific is passed in per call; this module never
// touches the DOM, storage, fetch or any Node API.

// The 13 catalog nutrients (spec §4), in the order the spec lists them.
export const NUTRIENTS = [
  { id: "energy_kj", name_es: "Energía (kJ)", unit: "kJ" },
  { id: "energy_kcal", name_es: "Energía (kcal)", unit: "kcal" },
  { id: "fat", name_es: "Grasas", unit: "g" },
  { id: "saturates", name_es: "Grasas saturadas", unit: "g" },
  { id: "unsaturates", name_es: "Grasas insaturadas", unit: "g" },
  { id: "monounsaturates", name_es: "Grasas monoinsaturadas", unit: "g" },
  { id: "polyunsaturates", name_es: "Grasas poliinsaturadas", unit: "g" },
  { id: "carbohydrate", name_es: "Hidratos de carbono", unit: "g" },
  { id: "sugars", name_es: "Azúcares", unit: "g" },
  { id: "fibre", name_es: "Fibra", unit: "g" },
  { id: "protein", name_es: "Proteínas", unit: "g" },
  { id: "salt", name_es: "Sal", unit: "g" },
  { id: "sodium", name_es: "Sodio", unit: "mg" },
];

// Aliases per id, already normalized (spec §6.4 rule 4): lowercase, trimmed,
// NFD-decomposed without combining marks, ß->ss, whitespace collapsed.
export const NUTRIENT_ALIASES = {
  energy: [
    "energie",
    "energy",
    "energia",
    "energiewaarde",
    "brennwert",
    "valeur energetique",
    "valor energetico",
  ],
  fat: [
    "fett",
    "vetten",
    "vet",
    "totaal vet",
    "matieres grasses",
    "grassi",
    "grasas",
    "fat",
    "lipides",
  ],
  saturates: [
    "davon gesattigte fettsauren",
    "gesattigte fettsauren",
    "waarvan verzadigde vetzuren",
    "verzadigde vetzuren",
    "waarvan verzadigd",
    "verzadigd vet",
    "verz. vet",
    "dont acides gras satures",
    "acides gras satures",
    "di cui acidi grassi saturi",
    "grassi saturi",
    "saturated fat",
    "saturates",
    "grasas saturadas",
  ],
  unsaturates: [
    "waarvan onverzadigde vetzuren",
    "onverzadigde vetzuren",
    "waarvan onverzadigd",
    "onverzadigd vet",
    "ungesattigte fettsauren",
    "acides gras insatures",
    "grassi insaturi",
    "unsaturated fat",
    "grasas insaturadas",
  ],
  monounsaturates: [
    "einfach ungesattigte fettsauren",
    "mono-onverzadigde vetzuren",
    "acides gras monoinsatures",
    "grassi monoinsaturi",
    "monounsaturated fat",
    "grasas monoinsaturadas",
  ],
  polyunsaturates: [
    "mehrfach ungesattigte fettsauren",
    "meervoudig onverzadigde vetzuren",
    "acides gras polyinsatures",
    "grassi polinsaturi",
    "polyunsaturated fat",
    "grasas poliinsaturadas",
  ],
  carbohydrate: [
    "kohlenhydrate",
    "koolhydraten",
    "glucides",
    "carboidrati",
    "carbohydrate",
    "carbohydrates",
    "hidratos de carbono",
    "carbohidratos",
  ],
  sugars: [
    "davon zucker",
    "zucker",
    "waarvan suikers",
    "suikers",
    "dont sucres",
    "sucres",
    "di cui zuccheri",
    "zuccheri",
    "sugars",
    "azucares",
  ],
  fibre: [
    "ballaststoffe",
    "voedingsvezels",
    "vezels",
    "fibres alimentaires",
    "fibres",
    "fibre alimentari",
    "fibre",
    "fiber",
    "fibra",
  ],
  protein: [
    "eiweiss",
    "eiwit",
    "eiwitten",
    "proteinen",
    "proteines",
    "proteine",
    "protein",
    "proteinas",
  ],
  salt: ["salz", "zout", "sel", "sale", "salt", "sal"],
  sodium: ["natrium", "sodium", "sodio"],
};

// Order the parser tries ids for name matching (spec §6.4 rule 3).
export const NUTRIENT_MATCH_ORDER = [
  "energy",
  "saturates",
  "monounsaturates",
  "polyunsaturates",
  "unsaturates",
  "fat",
  "sugars",
  "carbohydrate",
  "fibre",
  "protein",
  "salt",
  "sodium",
];

const NUTRIENT_BY_ID = new Map(NUTRIENTS.map((n) => [n.id, n]));

export function getNutrient(id) {
  return NUTRIENT_BY_ID.get(id) ?? null;
}

// Parse a printed number: comma or dot decimals; empty, null/undefined or
// unparseable text -> null (spec rule 5.2).
export function parseNumber(str) {
  if (str === null || str === undefined) {
    return null;
  }
  if (typeof str !== "string") {
    str = String(str);
  }
  const trimmed = str.trim();
  if (trimmed === "") {
    return null;
  }
  // Accept a single sign, digits, one decimal separator and optional
  // surrounding whitespace; reject any other characters.
  const normalized = trimmed.replace(/,/g, ".");
  if (!/^[+-]?(?:\.\d+|\d+(?:\.\d*)?)$/.test(normalized)) {
    return null;
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

// Presentation-only rounding (spec rule 5.6).
export function round2(x) {
  if (typeof x !== "number" || !Number.isFinite(x)) {
    return x;
  }
  return Math.round(x * 100) / 100;
}

// Unrounded conversion from grams of salt to milligrams of sodium (spec 5.3).
export function saltToSodiumMg(saltG) {
  if (saltG === null || typeof saltG !== "number" || !Number.isFinite(saltG)) {
    return null;
  }
  return (saltG / 2.5) * 1000;
}

// Scale a per-100 value by an amount, unrounded (spec 5.4/5.6).
export function scalePer100(value, amount) {
  if (value === null || amount === null) {
    return null;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return null;
  }
  return (value * amount) / 100;
}

export function convertAmount({ value, from, to, density }) {
  if (value === null || value === undefined) {
    return null;
  }
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    from === null ||
    to === null ||
    from === undefined ||
    to === undefined
  ) {
    return null;
  }
  if (from === to) {
    return value;
  }
  // Cross g <-> ml needs a user-provided density (g/ml); never invented.
  if (density === null || density === undefined) {
    return null;
  }
  if (typeof density !== "number" || !Number.isFinite(density) || density <= 0) {
    return null;
  }
  if (from === "g" && to === "ml") {
    return value / density;
  }
  if (from === "ml" && to === "g") {
    return value * density;
  }
  return null;
}
