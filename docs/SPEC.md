# SPEC — Nutrition Label Tracker

Contract for the tests and the code. The requester's messages in the chat are the
source of truth; where this file and the brief differ, the requester's words win.

## 1. Product

A free web app, without ads, for people who want to look after their diet. The
user photographs the nutrition table on a supermarket product, the app reads it
with AI-based OCR, and from then on everything is deterministic: the user saves
the product, tracks the nutrients they choose (a custom mix, e.g. calories,
sodium, saturated fat — not locked to weight loss or heart health), and plans
meals by entering how many grams (or ml) of each food a dish contains.

## 2. Fixed requirements (from the chat)

- **R-1.** The user can take a photo of the nutrition table on a product's
  packaging (file input with camera capture on phones).
- **R-2.** The table is read from the photo using AI-based OCR.
- **R-3.** Everything after the OCR step is deterministic: storing, calculating,
  tracking, planning. No AI anywhere else.
- **R-4.** The user chooses which nutrients to track and can build a custom mix.
  The app is not locked to a single goal.
- **R-5.** Meal planner: the user enters the grams (or ml, per the product's
  basis) of each food in a dish; the app computes the dish's nutrition from the
  scanned products.
- **R-6.** The app is published free of charge and has no ads. The UI footer
  says so: "Gratis y sin anuncios."
- **R-7.** The OCR copes with the variations in the three sample photos:
  several languages on one label; values per 100 g, per 100 ml or per portion;
  photos that are rotated, blurry or partly covered by a finger.

## 3. Stack and layout

- Node 24, ES modules, no build step, no dependencies.
- `src/` — pure logic. Everything platform-specific (fetch, storage) is passed
  in as a parameter, so tests run without network or browser.
- `public/` — static UI: HTML, CSS, ES modules importing `src/`. Camera capture
  via `<input type="file" accept="image/*" capture="environment">`.
- `tests/` — `node:test`. Only the tests stand in for the network (fake fetch).
- `.github/workflows/ci.yml` — runs `npm test` on Node 24.
- Code, tests, docs and commit messages in English. All user-visible texts in
  Spanish.
- **Serving:** the app is served statically from the **repository root** (e.g.
  `npx serve .` or `python3 -m http.server 8000`) and opened at `/public/`, so
  that modules in `public/` can `import ... from "../src/....js"` directly. No
  build step, ever.

## 4. Sample fixtures (exact, from the shared photos)

Tests use these exact values. EU comma decimals on the labels (`2,4`, `0,18`,
`3,9`, `5,0 %`).

### Fixture F1 — Dr. Schär "Melto" (1.jpg)

Gluten-free chocolate-covered hazelnut bars. Package 90 g, 3 bars. Portion:
30 g = 1 Melto. Multilingual label (DE/FR/NL/IT), ingredients beside the table.
Columns: per 100 g, per 30 g.

| Nutrient | Per 100 g | Per 30 g |
|---|---|---|
| Energy | 2292 kJ / 549 kcal | 688 kJ / 165 kcal |
| Fat | 33 g | 10 g |
| of which saturates | 13 g | 3,9 g |
| Carbohydrate | 55 g | 16 g |
| of which sugars | 45 g | 14 g |
| Fibre | 2,4 g | 0,7 g |
| Protein | 6,8 g | 2,0 g |
| Salt | 0,18 g | 0,05 g |

Derived (not printed): sodium 72 mg per 100 g; 21,6 mg per 30 g (computed from
the per-100 column, rule 5.5 — the printed 0,05 g salt would give 20 mg, and
that difference is expected, exactly like carbs 16 printed vs 16,5 computed).

### Fixture F2 — Fresh-squeezed juice (2.jpg)

Apple/orange/mango juice, Dutch label. Package 1 L, 5 portions of 200 ml.
Columns: per 100 ml, per glass (200 ml).

| Nutrient | Per 100 ml | Per glass (200 ml) |
|---|---|---|
| Energy | 199 kJ / 47 kcal | 399 kJ / 94 kcal |
| Fat | 0 g | 0 g |
| of which saturates | 0 g | 0 g |
| of which unsaturates ("waarvan onverzadigde") | 0 g | 0 g |
| Carbohydrate | 11 g | 22 g |
| of which sugars | 10 g | 20 g |
| Fibre | 0,7 g | 1,4 g |
| Protein | 0,4 g | 0,8 g |
| Salt | 0 g | 0 g |

The "waarvan onverzadigde" row maps to the catalog id `unsaturates`;
`monounsaturates` and `polyunsaturates` are **not** printed and stay `null`.

Vitamin C: 21 mg per 100 ml = 26 % of the reference intake (RI).
A second small per-glass table shows % RI (energy 5,0 %, fat 0 %, saturates
0 %, carbohydrate 8,0 %, sugars 22 %, salt 0 %). **That table is ignored** — it
is not a nutrient column. Reference intake printed: 8400 kJ / 2000 kcal per day.

### Fixture F3 — Olive oil spray (3.jpg)

Extra virgin olive oil spray (Albert Heijn), Dutch label, 200 ml. The photo is
rotated ~90°. Only a per-100 ml column.

| Nutrient | Per 100 ml |
|---|---|
| Energy | 3404 kJ / 828 kcal |
| Fat | 92 g |
| of which saturates | 14 g |
| Carbohydrate | 0 g |
| of which sugars | 0 g |
| Fibre | 0 g |
| Protein | 0 g |
| Salt | 0 g |

Vitamin E: 18 mg per 100 ml = 150 % RI. Reference intake printed:
8400 kJ / 2000 kcal per day.

## 5. Calculation rules (fixed)

1. **kJ and kcal are stored exactly as printed, never converted** between each
   other. If one is missing it stays `null`. (The printed pairs share no single
   factor: 2292/549, 199/47, 3404/828.)
2. **Decimals:** both comma and dot parse (`"2,4"` → `2.4`, `"3.9"` → `3.9`).
3. **`null` ≠ 0.** A missing or unreadable value is `null`; it is never
   invented and never treated as zero. A printed `0 g` is the number `0`.
4. **Sodium is in mg end to end.** `per100.sodium`, `nutrientValue(product,
   "sodium")`, dish totals, day totals and targets for sodium are all **mg**.
   Derivation when the label prints only salt: `sodium_mg = salt_g / 2.5 ×
   1000` (EU factor), i.e. `salt_g × 400`, rounded to 0.1 mg. F1: salt 0.18 g →
   72 mg per 100 g; a 30 g amount → 21.6 mg (rule 5.5). Sodium printed on the
   label is used instead: printed in g it normalizes to mg (`"0,072 g"` → 72);
   printed in mg it is taken as-is (`"72 mg"` → 72).
5. **Calculation source is the per-100 g / per-100 ml column.** The portion
   column is kept as printed (plus the portion size), but never used as a
   formula check — it is rounded on the label (F1: 55 g carbs → printed 16 g
   per 30 g, not 16.5; 2292 kJ → printed 688 kJ). When the user picks
   "1 porción", the app computes `portion_size × per-100 value / 100`
   (16.5 g for F1 carbs — the difference from the printed 16 g is expected).
6. **ml is never equated with g.** Each product has a basis: `"g"` or `"ml"`.
   Dish amounts are entered in the product's basis. A product may carry an
   optional user-entered `densityGPerMl` (number > 0) that lets the UI convert
   an amount for that product only. No hardcoded densities anywhere.
7. **Scaling:** `nutrient_amount = per100_value × amount / 100`, rounded to 2
   decimals (`Math.round(v * a) / 100`) so results compare exactly in tests
   (55 × 30 → 16.5; 549 × 30 → 164.7; 72 × 30 → 21.6). If `per100_value` is
   `null`, the result for that nutrient is `null` (unknown), never 0. Dish and
   day totals sum the rounded contributions and round the sum to 2 decimals; a
   nutrient with any `null` contribution is reported as `null` (partially
   unknown) with the list of products missing it.

## 6. Nutrient catalog

Fixed catalog of trackable nutrients. `id`, Spanish display name, display unit:

| id | Nombre (ES) | Unit |
|---|---|---|
| `energy_kj` | Energía (kJ) | kJ |
| `energy_kcal` | Energía (kcal) | kcal |
| `fat` | Grasas | g |
| `saturates` | Grasas saturadas | g |
| `unsaturates` | Grasas insaturadas | g |
| `monounsaturates` | Grasas monoinsaturadas | g |
| `polyunsaturates` | Grasas poliinsaturadas | g |
| `carbohydrate` | Carbohidratos | g |
| `sugars` | Azúcares | g |
| `fibre` | Fibra | g |
| `protein` | Proteínas | g |
| `salt` | Sal | g |
| `sodium` | Sodio | mg (stored in mg, shown in mg) |

`unsaturates` is the total-unsaturates row (F2's "waarvan onverzadigde");
`monounsaturates`/`polyunsaturates` stay `null` unless the label prints them.

**Extras:** anything else on a label (vitamins, minerals, …) is stored per
product as `{ name, amount, unit, ri_percent }` — per the product's basis
(per 100 g or per 100 ml), `unit` one of `g | mg | µg`, `ri_percent` a number
or `null`. `name` is the nutrient name **as printed** on the label (any
language); the user may rename it in the Revisar screen. An extra becomes
trackable once it exists in a saved product; the tracking UI offers it under
its `name` with its `unit`. Examples: F2 `{ name: "Vitamine C", amount: 21,
unit: "mg", ri_percent: 26 }`; F3 `{ name: "Vitamine E", amount: 18, unit:
"mg", ri_percent: 150 }`.

## 7. OCR contract (the only AI part)

One path, no proxy: the browser calls an OpenAI-compatible chat completions
endpoint with the user's base URL, API key and model. Settings live in
`localStorage` only, are never committed and never sent anywhere but the
configured endpoint. The UI explains that the URL is the base of the API, that
the endpoint must allow browser (CORS) requests, and that the user's provider
may charge per call.

### 7.1 Prompt duties (rotation, blur, finger, languages)

Coping with rotated, blurry or partly covered photos is a duty of the **prompt**
(and of the human Revisar step), not of the parser. `OCR_PROMPT`
(`src/ocr-prompt.js`, English instructions to the model) must explicitly tell
the model to:

- read the nutrition table even if the photo is **rotated** (any angle),
  **blurry**, or partly covered by a **finger** or shadow;
- handle **multilingual** labels (DE/FR/NL/IT/EN/ES may share one label);
- return **strict JSON only**, per the schema below;
- copy every value as a **string exactly as printed**, keeping the printed
  decimal separator (`"0,18"`, `"3,9"`, `"2,4"`);
- copy energy exactly as printed, e.g. `"2292 kJ / 549 kcal"`;
- **never invent** values: an unreadable cell gets `value: null` and an entry
  in `unreadable`;
- ignore %RI-only tables/columns;
- keep vitamin/mineral rows with their amount, unit and % RI;
- report each column's basis (`amount` + `unit`: 100 g, 30 g, 200 ml, …).

Tests assert the prompt contains the words "rotated", "blurry", "finger",
"multilingual" and "unreadable".

### 7.2 Response JSON schema (what the model returns, what the parser accepts)

```json
{
  "product_name": "string | null",
  "basis": "g | ml",
  "columns": [
    {
      "label": "string, as printed (e.g. \"100 g\", \"30 g = 1 Melto\")",
      "amount": 100,
      "unit": "g | ml",
      "values": [
        { "nutrient": "string, as printed (any language)",
          "value": "string as printed (\"0,18\", \"2292 kJ / 549 kcal\") | number | null",
          "unit": "g | mg | µg | mcg | kJ | kcal | % | null",
          "ri_percent": 26 }
      ]
    }
  ],
  "unreadable": ["string — cells or fields the model could not read"],
  "notes": "string | null"
}
```

### 7.3 Normalization (pure, in `src/ocr-parse.js`)

`parseOcrResponse` applies these steps, in order, deterministically:

1. **Input.** A string is `JSON.parse`d first (failure → `OcrParseError`
   code `"invalid_json"`). The result must be an object with `basis` `"g"` or
   `"ml"` and a non-empty `columns` array of the shape above (else
   `"invalid_schema"`).
2. **Unit normalization** (case-insensitive, trimmed): `g` → `"g"`;
   `mg` → `"mg"`; `µg`, `μg`, `mcg`, `ug` → `"µg"`; `kj` → `"kJ"`;
   `kcal` → `"kcal"`; `%`, `% ri`, `%ri` → `"%"`. `null` stays `null`. Any
   other unit → `"invalid_schema"`. If `unit` is `null` and the value string
   ends with a known unit token (`"33 g"`), the parser adopts that unit.
3. **Value parsing.** Numbers pass through. Strings go through `parseNumber`
   (comma/dot decimals, spaces as thousands separators). `null`, empty or
   unparseable values make the cell **unreadable**: the nutrient is omitted
   from that column's output and `"<nutrient> (<column label>)"` is appended
   to the output's `unreadable` list (so Revisar can highlight it).
4. **Energy split.** A value string containing both `kJ` and `kcal`
   (case-insensitive) splits into `energy_kj` and `energy_kcal` by extracting
   the number before each unit token:
   `/(-?[\d.,\s]+?)\s*kJ/i` and `/(-?[\d.,\s]+?)\s*kcal/i`, each parsed with
   `parseNumber`. `"2292 kJ / 549 kcal"` → `energy_kj: 2292`,
   `energy_kcal: 549`. If only one token is present, only that id is set; the
   other stays absent (`null`). Entries with unit `kJ`/`kcal` map to
   `energy_kj`/`energy_kcal` directly. An energy row where neither kJ nor
   kcal can be extracted is treated as unreadable (step 3).
5. **Nutrient mapping.** Normalize the printed nutrient string: lowercase,
   NFD, strip diacritics, `ß` → `ss`, collapse whitespace, trim. Split on
   `/`; for each part, repeatedly strip leading qualifiers (`davon`,
   `waarvan`, `dont`, `di cui`, `of which`, `de los cuales`,
   `de las cuales`) and trim. A part that exactly equals an alias in
   `NUTRIENT_ALIASES` maps to that id. Ids are checked in this order:
   `saturates, monounsaturates, polyunsaturates, unsaturates, sugars, fibre,
   protein, salt, sodium, fat, carbohydrate, energy`; first exact match wins.
   `energy` triggers step 4. Unmapped rows with a parsed amount and unit
   `g`/`mg`/`µg` become **extras** (`{ name: printed string trimmed, amount,
   unit, ri_percent }`) — but only in the per-100 column; unmapped rows in
   other columns are ignored.
6. **%RI.** Values with unit `"%"` are dropped. A column whose values are all
   percents (or that has no values left after dropping) is **discarded as a
   column** — it can never become the per-100 or the portion column. Vitamin
   rows with `mg`/`µg` amounts keep their `ri_percent` (parsed with
   `parseNumber`, `null` if absent) and live on as extras.
7. **Column selection.** The per-100 column is the first column with
   `amount === 100` and `unit === basis`; if none → `OcrParseError` code
   `"no_per100_column"`. The portion column is the first remaining
   (non-discarded) column with `unit === basis` and `amount !== 100`; any
   further columns are ignored. No portion column → `portion: null`.
8. **Sodium.** A row mapped to `sodium` with unit `g` is multiplied by 1000;
   unit `mg` is taken as-is. Sodium is stored in mg everywhere (rule 5.4).
   Salt stays in g.
9. **Output** (exact shape):

```js
{
  productName: "Dr. Schär Melto",   // string | null
  basis: "g",                       // "g" | "ml"
  per100: { energy_kj: 2292 },      // catalog ids → number; absent = null
  extras: [],                       // [{ name, amount, unit, ri_percent }]
  portion: { label: "30 g = 1 Melto", amount: 30, unit: "g",
             values: { /* catalog ids → number, as printed */ } } | null,
  unreadable: [],                   // model's list + parser-added cells
  notes: null
}
```

### 7.4 Multilingual aliases (`NUTRIENT_ALIASES`, exported)

Aliases are listed already normalized (lowercase, no diacritics). The table
covers at least DE/FR/NL/IT plus EN/ES:

```js
const NUTRIENT_ALIASES = {
  energy: ["energie", "energia", "energy", "energiewaarde", "valor energetico"],
  fat: ["fett", "matieres grasses", "vetten", "vet", "grassi", "lipides",
        "fat", "grasas", "grasa"],
  saturates: ["gesattigte fettsauren", "davon gesattigte fettsauren",
        "verzadigde vetzuren", "waarvan verzadigde", "verzadigde", "verzadigd",
        "acides gras satures", "dont acides gras satures",
        "acidi grassi saturi", "di cui acidi grassi saturi",
        "of which saturates", "saturates", "grasas saturadas"],
  unsaturates: ["ungesattigte fettsauren", "davon ungesattigte fettsauren",
        "onverzadigde vetzuren", "waarvan onverzadigde", "onverzadigde",
        "acides gras insatures", "dont acides gras insatures",
        "acidi grassi insaturi", "di cui acidi grassi insaturi",
        "of which unsaturates", "unsaturates", "grasas insaturadas"],
  monounsaturates: ["einfach ungesattigte fettsauren",
        "enkelvoudig onverzadigde", "waarvan enkelvoudig onverzadigde",
        "enkelvoudig onverzadigde vetzuren", "acides gras mono-insatures",
        "dont acides gras mono-insatures", "mono-insatures",
        "acidi grassi monoinsaturi", "di cui acidi grassi monoinsaturi",
        "monoinsaturi", "monounsaturates", "grasas monoinsaturadas"],
  polyunsaturates: ["mehrfach ungesattigte fettsauren",
        "meervoudig onverzadigde", "waarvan meervoudig onverzadigde",
        "meervoudig onverzadigde vetzuren", "acides gras polyinsatures",
        "dont acides gras polyinsatures", "polyinsatures",
        "acidi grassi polinsaturi", "di cui acidi grassi polinsaturi",
        "polinsaturi", "polyunsaturates", "grasas poliinsaturadas"],
  carbohydrate: ["kohlenhydrate", "glucides", "koolhydraten", "carboidrati",
        "carbohydrate", "carbohydrates", "carbohidratos",
        "hidratos de carbono"],
  sugars: ["zucker", "davon zucker", "sucres", "dont sucres", "suikers",
        "waarvan suikers", "zuccheri", "di cui zuccheri", "of which sugars",
        "sugars", "azucares"],
  fibre: ["ballaststoffe", "fibres", "fibres alimentaires", "vezels",
        "voedingsvezels", "fibre", "fibre alimentari", "dietary fibre",
        "fibra", "fibra alimentaria"],
  protein: ["eiweiss", "eiwit", "proteines", "eiwitten", "proteine",
        "protein", "proteins", "proteinas"],
  salt: ["salz", "sel", "zout", "sale", "salt", "sal"],
  sodium: ["natrium", "sodium", "sodio"]
};
```

### 7.5 Executable fixtures (normative)

Tests embed these literals verbatim (e.g. in `tests/fixtures/`); the literals
below are the normative contract: `parseOcrResponse(F1_RAW)` must deep-equal
`F1_NORMALIZED`, and likewise for F2 and F3.

```js
const F1_RAW = {
  product_name: "Dr. Schär Melto",
  basis: "g",
  columns: [
    {
      label: "100 g", amount: 100, unit: "g",
      values: [
        { nutrient: "Energie / Énergie / Energie / Energia", value: "2292 kJ / 549 kcal", unit: null, ri_percent: null },
        { nutrient: "Fett / Matières grasses / Vetten / Grassi", value: "33", unit: "g", ri_percent: null },
        { nutrient: "davon gesättigte Fettsäuren / dont acides gras saturés / waarvan verzadigde / di cui acidi grassi saturi", value: "13", unit: "g", ri_percent: null },
        { nutrient: "Kohlenhydrate / Glucides / Koolhydraten / Carboidrati", value: "55", unit: "g", ri_percent: null },
        { nutrient: "davon Zucker / dont sucres / waarvan suikers / di cui zuccheri", value: "45", unit: "g", ri_percent: null },
        { nutrient: "Ballaststoffe / Fibres / Vezels / Fibre", value: "2,4", unit: "g", ri_percent: null },
        { nutrient: "Eiweiß / Protéines / Eiwitten / Proteine", value: "6,8", unit: "g", ri_percent: null },
        { nutrient: "Salz / Sel / Zout / Sale", value: "0,18", unit: "g", ri_percent: null }
      ]
    },
    {
      label: "30 g = 1 Melto", amount: 30, unit: "g",
      values: [
        { nutrient: "Energie / Énergie / Energie / Energia", value: "688 kJ / 165 kcal", unit: null, ri_percent: null },
        { nutrient: "Fett / Matières grasses / Vetten / Grassi", value: "10", unit: "g", ri_percent: null },
        { nutrient: "davon gesättigte Fettsäuren / dont acides gras saturés / waarvan verzadigde / di cui acidi grassi saturi", value: "3,9", unit: "g", ri_percent: null },
        { nutrient: "Kohlenhydrate / Glucides / Koolhydraten / Carboidrati", value: "16", unit: "g", ri_percent: null },
        { nutrient: "davon Zucker / dont sucres / waarvan suikers / di cui zuccheri", value: "14", unit: "g", ri_percent: null },
        { nutrient: "Ballaststoffe / Fibres / Vezels / Fibre", value: "0,7", unit: "g", ri_percent: null },
        { nutrient: "Eiweiß / Protéines / Eiwitten / Proteine", value: "2,0", unit: "g", ri_percent: null },
        { nutrient: "Salz / Sel / Zout / Sale", value: "0,05", unit: "g", ri_percent: null }
      ]
    }
  ],
  unreadable: [],
  notes: null
};

const F1_NORMALIZED = {
  productName: "Dr. Schär Melto",
  basis: "g",
  per100: {
    energy_kj: 2292, energy_kcal: 549,
    fat: 33, saturates: 13,
    carbohydrate: 55, sugars: 45,
    fibre: 2.4, protein: 6.8, salt: 0.18
  },
  extras: [],
  portion: {
    label: "30 g = 1 Melto", amount: 30, unit: "g",
    values: {
      energy_kj: 688, energy_kcal: 165,
      fat: 10, saturates: 3.9,
      carbohydrate: 16, sugars: 14,
      fibre: 0.7, protein: 2, salt: 0.05
    }
  },
  unreadable: [],
  notes: null
};
// Plus: nutrientValue(F1_product, "sodium") === 72 (mg per 100 g, derived);
// scalePer100(72, 30) === 21.6 (mg per portion, computed — not 20).

const F2_RAW = {
  product_name: "Vers geperst sap appel-sinaasappel-mango",
  basis: "ml",
  columns: [
    {
      label: "100 ml", amount: 100, unit: "ml",
      values: [
        { nutrient: "Energie", value: "199 kJ / 47 kcal", unit: null, ri_percent: null },
        { nutrient: "Vetten", value: "0", unit: "g", ri_percent: null },
        { nutrient: "waarvan verzadigde", value: "0", unit: "g", ri_percent: null },
        { nutrient: "waarvan onverzadigde", value: "0", unit: "g", ri_percent: null },
        { nutrient: "Koolhydraten", value: "11", unit: "g", ri_percent: null },
        { nutrient: "waarvan suikers", value: "10", unit: "g", ri_percent: null },
        { nutrient: "Vezels", value: "0,7", unit: "g", ri_percent: null },
        { nutrient: "Eiwitten", value: "0,4", unit: "g", ri_percent: null },
        { nutrient: "Zout", value: "0", unit: "g", ri_percent: null },
        { nutrient: "Vitamine C", value: "21", unit: "mg", ri_percent: 26 }
      ]
    },
    {
      label: "glas (200 ml)", amount: 200, unit: "ml",
      values: [
        { nutrient: "Energie", value: "399 kJ / 94 kcal", unit: null, ri_percent: null },
        { nutrient: "Vetten", value: "0", unit: "g", ri_percent: null },
        { nutrient: "waarvan verzadigde", value: "0", unit: "g", ri_percent: null },
        { nutrient: "waarvan onverzadigde", value: "0", unit: "g", ri_percent: null },
        { nutrient: "Koolhydraten", value: "22", unit: "g", ri_percent: null },
        { nutrient: "waarvan suikers", value: "20", unit: "g", ri_percent: null },
        { nutrient: "Vezels", value: "1,4", unit: "g", ri_percent: null },
        { nutrient: "Eiwitten", value: "0,8", unit: "g", ri_percent: null },
        { nutrient: "Zout", value: "0", unit: "g", ri_percent: null }
      ]
    },
    {
      label: "% RI per glas", amount: 200, unit: "ml",
      values: [
        { nutrient: "Energie", value: "5,0", unit: "%", ri_percent: null },
        { nutrient: "Vetten", value: "0", unit: "%", ri_percent: null },
        { nutrient: "waarvan verzadigde", value: "0", unit: "%", ri_percent: null },
        { nutrient: "Koolhydraten", value: "8,0", unit: "%", ri_percent: null },
        { nutrient: "waarvan suikers", value: "22", unit: "%", ri_percent: null },
        { nutrient: "Zout", value: "0", unit: "%", ri_percent: null }
      ]
    }
  ],
  unreadable: [],
  notes: "Referentie-inname van een gemiddelde volwassene (8400 kJ / 2000 kcal)."
};

const F2_NORMALIZED = {
  productName: "Vers geperst sap appel-sinaasappel-mango",
  basis: "ml",
  per100: {
    energy_kj: 199, energy_kcal: 47,
    fat: 0, saturates: 0, unsaturates: 0,
    carbohydrate: 11, sugars: 10,
    fibre: 0.7, protein: 0.4, salt: 0
  },
  extras: [ { name: "Vitamine C", amount: 21, unit: "mg", ri_percent: 26 } ],
  portion: {
    label: "glas (200 ml)", amount: 200, unit: "ml",
    values: {
      energy_kj: 399, energy_kcal: 94,
      fat: 0, saturates: 0, unsaturates: 0,
      carbohydrate: 22, sugars: 20,
      fibre: 1.4, protein: 0.8, salt: 0
    }
  },
  unreadable: [],
  notes: "Referentie-inname van een gemiddelde volwassene (8400 kJ / 2000 kcal)."
};
// No trace of the %RI column; monounsaturates/polyunsaturates absent (null).

const F3_RAW = {
  product_name: "AH Extra vierge olijfolie spray",
  basis: "ml",
  columns: [
    {
      label: "100 ml", amount: 100, unit: "ml",
      values: [
        { nutrient: "Energie", value: "3404 kJ / 828 kcal", unit: null, ri_percent: null },
        { nutrient: "Vetten", value: "92", unit: "g", ri_percent: null },
        { nutrient: "waarvan verzadigde", value: "14", unit: "g", ri_percent: null },
        { nutrient: "Koolhydraten", value: "0", unit: "g", ri_percent: null },
        { nutrient: "waarvan suikers", value: "0", unit: "g", ri_percent: null },
        { nutrient: "Vezels", value: "0", unit: "g", ri_percent: null },
        { nutrient: "Eiwitten", value: "0", unit: "g", ri_percent: null },
        { nutrient: "Zout", value: "0", unit: "g", ri_percent: null },
        { nutrient: "Vitamine E", value: "18", unit: "mg", ri_percent: 150 }
      ]
    }
  ],
  unreadable: [],
  notes: "Referentie-inname van een gemiddelde volwassene (8400 kJ / 2000 kcal)."
};

const F3_NORMALIZED = {
  productName: "AH Extra vierge olijfolie spray",
  basis: "ml",
  per100: {
    energy_kj: 3404, energy_kcal: 828,
    fat: 92, saturates: 14,
    carbohydrate: 0, sugars: 0,
    fibre: 0, protein: 0, salt: 0
  },
  extras: [ { name: "Vitamine E", amount: 18, unit: "mg", ri_percent: 150 } ],
  portion: null,
  unreadable: [],
  notes: "Referentie-inname van een gemiddelde volwassene (8400 kJ / 2000 kcal)."
};
```

## 8. Modules (`src/`), signatures and examples

All pure unless noted. Amounts are numbers; missing/unreadable is `null`.

### `src/nutrients.js` — catalog and units

- `NUTRIENTS` — array of `{ id, nameEs, unit }` exactly as in §6 (13 entries).
- `getNutrient(id)` → the entry or `null`.
- `parseNumber(text)` → `number | null`. Trims; removes spaces used as
  thousands separators (`"1 292"` → `1292`); with both `,` and `.` the
  rightmost is the decimal separator, the other is stripped (`"1.292,5"` →
  `1292.5`); a single `,` or `.` is the decimal separator (`"0,18"` → `0.18`,
  `"3.9"` → `3.9`). Empty or non-numeric → `null`.
- `saltToSodiumMg(saltG)` → `number | null`; `Math.round(saltG * 4000) / 10`
  (0.1 mg precision); `saltToSodiumMg(0.18)` → `72`; `null` in → `null` out.
- `scalePer100(per100Value, amount)` → `number | null`;
  `Math.round(per100Value * amount) / 100`; `scalePer100(55, 30)` → `16.5`;
  `scalePer100(72, 30)` → `21.6`; `null` in → `null` out.
- `convertAmount(amount, fromUnit, toUnit, densityGPerMl?)` → `number | null`;
  converts only g↔g, ml↔ml, and g↔ml when `densityGPerMl > 0` is given;
  otherwise `null`. Never assumes 1 ml = 1 g.

### `src/ocr-prompt.js` — the OCR prompt

- `OCR_PROMPT` — the instruction string (§7.1; contains "rotated", "blurry",
  "finger", "multilingual", "unreadable").
- `buildOcrMessages(imageDataUrl)` → the `messages` array:
  `[{ role: "system", content: OCR_PROMPT }, { role: "user", content: [
  { type: "text", text: "Read the nutrition table in this photo and return
  only the JSON." }, { type: "image_url", image_url: { url: imageDataUrl } }] }]`.

### `src/ocr-parse.js` — normalize the model's JSON (pure)

- `NUTRIENT_ALIASES` — the table of §7.4.
- `parseOcrResponse(json)` — `json` is the parsed object or the raw string;
  returns the normalized label of §7.3 step 9; throws `OcrParseError`.
- `OcrParseError` — `Error` subclass with a `code` field:
  `"invalid_json" | "invalid_schema" | "no_per100_column"`.

### `src/ocr-client.js` — the network call (fetch injected)

- `async extractLabel({ fetch, settings, imageDataUrl })` → the normalized
  result of `parseOcrResponse`. `settings = { url, apiKey, model }`. Exactly:
  - URL: `settings.url` with trailing slashes stripped + `"/chat/completions"`.
  - `fetch(url, { method: "POST", headers: { "Authorization": "Bearer " +
    settings.apiKey, "Content-Type": "application/json" }, body:
    JSON.stringify({ model: settings.model, messages:
    buildOcrMessages(imageDataUrl), response_format: { type: "json_object" },
    temperature: 0 }) })`.
  - `const data = await res.json()`; content from
    `data.choices[0].message.content`; that string is `JSON.parse`d and passed
    to `parseOcrResponse`.
- Throws `OcrClientError` (`error.code`, Spanish `error.message`):
  - `"network"` — fetch rejected / CORS: "No se pudo conectar con el servicio
    de OCR. Revisá la URL y que el servicio permita peticiones desde el
    navegador (CORS)."
  - `"auth"` (401/403): "La clave de API fue rechazada. Revisala en Ajustes."
  - `"rate_limit"` (429): "El servicio de OCR está ocupado. Probá de nuevo en
    unos segundos."
  - `"http"` (any other non-2xx): "El servicio de OCR respondió con un error
    (HTTP {status})."
  - `"empty"` — no `choices[0].message.content`: "El servicio de OCR devolvió
    una respuesta vacía."
  - `"invalid_json"` — body or content not parseable as JSON: "El servicio de
    OCR devolvió una respuesta inválida."
  - `OcrParseError` from normalization propagates unchanged.
- `OcrClientError` — `Error` subclass with a `code` field.
- Tests use a fake `fetch`; they never hit the network.

### `src/products.js` — saved products (pure; storage injected)

Product shape:

```js
{ id: "p_...", name: "Melto", basis: "g",
  per100: { /* catalog ids → number|null; sodium in mg */ },
  extras: [ { name, amount, unit, ri_percent } ],
  portion: { label, amount, unit, values } | null,
  densityGPerMl: null,             // optional, user-entered, > 0
  createdAt: "ISO string" }
```

- `createProduct(data, meta)` → product. `meta = { id, createdAt }` is injected
  by the caller (the UI passes `p_${Date.now().toString(36)}` and
  `new Date().toISOString()`), so the function stays pure. Validates: basis
  `"g"|"ml"`; per100 values number|null; extras `{ name, amount, unit:
  "g"|"mg"|"µg", ri_percent: number|null }`; portion `null` or `{ label,
  amount > 0, unit: basis, values }`; `densityGPerMl` `null` or `> 0`. Throws
  `TypeError` on invalid input. Derives nothing — sodium is computed at read
  time by `nutrientValue`.
- `updateProduct(product, patch)` → new product (no mutation; revalidates).
- `listProducts(store)` / `getProduct(store, id)` / `saveProduct(store,
  product)` / `deleteProduct(store, id)` — `store` is the storage facade
  (§ `storage.js`); these only (de)serialize and delegate.
- `nutrientValue(product, nutrientId)` → per-100 value (`number | null`):
  - `"sodium"`: printed `per100.sodium` (mg) if present, else
    `saltToSodiumMg(per100.salt)`. F1 → `72` (mg).
  - catalog ids: `per100[id]`.
  - anything else: extras matched by `name` (case-insensitive, trimmed) →
    `amount`, or `null`.

### `src/dish.js` — the meal planner math (pure)

Dish shape: `{ id, name, items: [{ productId, amount }] }` — `amount` in the
product's basis (g or ml).

- `computeDishTotals(items, productsById, nutrientIds)` →
  `{ [nutrientId]: { value: number | null, unknownIn: [productId] } }`.
  Each contribution is `scalePer100(nutrientValue(product, id), amount)`;
  totals sum the rounded contributions and round to 2 decimals (rule 5.7).
  Any `null` contribution makes the total `null` and lists the product in
  `unknownIn`. For extras (matched by name), amounts sum only when units
  match; a unit mismatch makes the total `null` with the conflicting products
  in `unknownIn`.
  Example: 30 g of F1 → `energy_kcal: { value: 164.7, unknownIn: [] }`,
  `carbohydrate: { value: 16.5, unknownIn: [] }`, `sodium: { value: 21.6,
  unknownIn: [] }` (mg); 200 ml of F2 → `energy_kcal: 94`, `sugars: 20`.
- `portionAmount(product)` → the amount for "1 porción" (`portion.amount`) or
  `null` when the product has no portion.

### `src/tracking.js` — the custom nutrient mix and targets (pure)

- `DEFAULT_SELECTION` — `["energy_kcal", "sodium", "saturates"]` (a starting
  mix; the user changes it freely).
- `sanitizeSelection(ids, extraNames = [])` → deduped ids that exist in the
  catalog or in `extraNames` (the extras names collected from saved products).
- Target shape: `{ nutrientId, kind: "min" | "max", amount }` (per day, in the
  nutrient's display unit — mg for sodium).
- `evaluateTarget(total, target)` → `{ status: "ok" | "over" | "under" |
  "unknown", percent: number | null }`. Exact compare rule, **no tolerance**:
  - `total === null` or `amount <= 0` → `{ status: "unknown", percent: null }`.
  - `"min"`: `total >= amount` → `"ok"`, else `"under"`.
  - `"max"`: `total <= amount` → `"ok"`, else `"over"`.
  - `percent = Math.round(total / amount * 1000) / 10` (0.1 % precision).

### `src/log.js` — the day log (pure)

One day at a time, browsable by date. Entry: `{ date: "YYYY-MM-DD", dishId |
items, note? }`.

- `dateKey(date)` → `"YYYY-MM-DD"` (a `Date` uses local time; an ISO string
  keeps its first 10 chars).
- `computeDayTotals(entries, dishesById, productsById, nutrientIds)` → same
  shape as `computeDishTotals`, summing across entries (rule 5.7 applies across
  the whole day; sodium in mg).
- `compareWithTargets(totals, targets)` → `{ [nutrientId]:
  evaluateTarget(totals[nutrientId]?.value ?? null, target) }`.

### `src/storage.js` — persistence facade (storage injected)

- `createStorage(backend)` — `backend` is anything with `getItem`/`setItem`
  (in the app: `localStorage`); a plain object without those methods is used
  via property access (tests pass `{}`). Keys are namespaced: `nlt.products`,
  `nlt.dishes`, `nlt.log`, `nlt.selection`, `nlt.targets`, `nlt.settings`,
  `nlt.usage`.
- `load(store, key, fallback)` / `save(store, key, value)` — JSON
  (de)serialization; corrupt JSON yields the fallback, never a throw.
- `exportAll(store)` → one JSON string with every key, **except that
  `nlt.settings` is exported without `apiKey`** (the API key never leaves the
  device in a backup file).
- `importAll(store, json)` → replaces all keys present in the file; ignores
  `apiKey` inside settings; throws on invalid JSON.
- Settings (OCR URL, key, model) are stored through this facade too, only in
  the browser's `localStorage`.

## 9. User interface (`public/`), screens in Spanish

Single-page app, mobile-first. Footer on every screen: "Gratis y sin
anuncios." All copy in Spanish.

1. **Escanear** — take/choose a photo (file input with camera capture). On
   submit, calls `extractLabel` with the saved settings; shows progress and the
   Spanish errors from §8. If no settings are configured, sends the user to
   Ajustes. Also offers "Cargar manualmente" (manual entry without photo).
2. **Revisar** — mandatory before saving. Shows the parsed product: name,
   basis, per-100 column, portion column as printed, extras. Unreadable/null
   fields are highlighted and editable; every value can be corrected; extras
   can be renamed; the basis (g/ml) and optional density can be set. "Guardar
   producto" persists via `products.js`. Nothing is saved without this screen.
3. **Productos** — list of saved products with their basis and portion; view,
   edit, delete; per product, the per-100 table including derived sodium in mg.
4. **Plato** — the meal planner: pick saved products, enter the amount of each
   in the product's basis (or "1 porción" where defined), see live totals via
   `computeDishTotals` for the user's selected nutrients; nutrients with
   unknown contributions are marked "sin datos" (never shown as 0). Save the
   dish; log it to a date.
5. **Hoy** — the day log: one day, browse by date; totals of the selected
   nutrients via `computeDayTotals`; progress vs the optional targets via
   `compareWithTargets` ("ok", "te pasaste", "te falta", "sin datos").
6. **Ajustes** — OCR endpoint (URL, API key, model). Explains: the URL is the
   **base** of an OpenAI-compatible API (e.g. `https://api.openai.com/v1`) and
   the app appends `/chat/completions`; the provider must allow browser
   requests (CORS); the provider may charge per scan. Also: nutrient selection
   (the custom mix, including extras from saved products); optional
   per-nutrient daily target (min/max); JSON export/import; "Tu uso" —
   local-only counters (products scanned, dishes planned, days logged), no
   analytics, nothing leaves the device.

## 10. Acceptance criteria

- **AC-1 (R-1):** Escanear offers camera capture via file input and accepts an
  image; the image reaches the OCR client as a base64 data URL.
- **AC-2 (R-2):** `extractLabel` POSTs to `{url-with-trailing-slash-stripped}
  /chat/completions` with headers `Authorization: Bearer <key>` and
  `Content-Type: application/json`, body `{ model, messages, response_format:
  { type: "json_object" }, temperature: 0 }`, reads
  `choices[0].message.content`, parses it as JSON and returns the normalized
  label (fake fetch in tests).
- **AC-3 (R-3):** every module except `ocr-client.js` is pure and contains no
  AI/network call; tests exercise them without network.
- **AC-4 (R-4):** the user can select any mix of catalog nutrients (and extras
  from saved products); the selection persists; nothing in the UI presumes a
  weight-loss or heart goal.
- **AC-5 (R-5):** entering amounts per product in a dish yields totals per
  selected nutrient per rule 5.7 (30 g F1 → 164.7 kcal, 16.5 g carbohydrate,
  21.6 mg sodium; 200 ml F2 → 94 kcal, 20 g sugars).
- **AC-6 (R-6):** no ads, no trackers, no accounts; the footer "Gratis y sin
  anuncios" is present; "Tu uso" counters stay local.
- **AC-7 (R-7):** (a) `OCR_PROMPT` explicitly instructs the model to read
  rotated, blurry and partly covered (finger) photos and multilingual labels,
  to return strict JSON, to keep printed decimal separators and to mark
  unreadable cells — rotation/blur/finger are duties of the prompt and of the
  Revisar screen, not of the parser. (b) The parser maps the exact raw
  fixtures F1/F2/F3 of §7.5 to the exact normalized outputs: multilingual
  alias mapping, the `"X kJ / Y kcal"` split, F2's %RI-only column discarded
  and its 200 ml glass column kept as the portion column, vitamins C/E kept
  as extras with `ri_percent`.
- **AC-8:** kJ and kcal are stored as printed and never converted; a missing
  one stays `null` (rule 5.1).
- **AC-9:** `parseNumber("2,4")` → `2.4`, `parseNumber("3.9")` → `3.9`;
  `null` is never coerced to `0` anywhere (rules 5.2, 5.3).
- **AC-10:** sodium is in mg end to end: `nutrientValue(F1, "sodium")` → `72`
  (mg per 100 g, derived from salt ÷ 2.5); 30 g → `21.6` mg; printed sodium in
  g or mg normalizes to mg; dish totals, day totals and targets for sodium are
  in mg (rule 5.4).
- **AC-11:** calculations use only the per-100 column; the portion column is
  kept as printed; "1 porción" computes portion size × per-100 (F1 carbs →
  16.5 g, not the printed 16 g) (rule 5.5).
- **AC-12:** ml and g are never equated; dish amounts use the product's basis;
  g↔ml conversion happens only with a user-entered density for that product
  (rule 5.6).
- **AC-13:** malformed OCR input raises typed errors — parser:
  `invalid_json`, `invalid_schema`, `no_per100_column`; client: `network`,
  `auth` (401/403), `rate_limit` (429), `http` (other), `empty`,
  `invalid_json` — with the Spanish messages of §8.
- **AC-14:** nothing is saved without the Revisar screen; unreadable fields
  are highlighted and editable; manual entry without a photo works.
- **AC-15:** optional daily targets (min/max) evaluate against day totals with
  the exact rule of §8 (`min`: ok when total ≥ amount, else under; `max`: ok
  when total ≤ amount, else over; null total → unknown; no tolerance); days
  are browsable by date.
- **AC-16:** JSON export/import round-trips all data; `exportAll` omits the
  API key; corrupt stored JSON falls back without throwing.
- **AC-17:** settings (URL, key, model) live only in localStorage; Ajustes
  explains the base URL (e.g. `https://api.openai.com/v1`), CORS and that the
  provider may charge.
- **AC-18:** the F2 "waarvan onverzadigde" row maps to catalog id
  `unsaturates`; `monounsaturates`/`polyunsaturates` stay `null` unless
  printed.

## 11. Open questions for the requester (with the defaults this spec adopts)

1. **Language of the app** — default: Spanish (the requester wrote in Spanish).
2. **Platform** — default: mobile web app (works on any phone, no store, keeps
   it free).
3. **OCR cost** — the app is free and ad-free, but the AI OCR needs an
   OpenAI-compatible endpoint the user configures; their provider may charge
   per scan. Default: acceptable, explained in Ajustes. (Alternative would be
   a publisher-paid server, which breaks "free".)
4. **Targets and day log** — default: included as optional (per-nutrient daily
   min/max, one-day log browsable by date). "Track" is read as totals plus
   optional goals; easy to drop if the requester only wants totals.
5. **Liquids in the planner** — default: amounts are entered in the product's
   own basis (ml for juice and oil); g↔ml only via an optional user-entered
   density per product. Never 1 ml = 1 g.
6. **Sodium** — labels print salt; default: derive sodium = salt / 2.5 and
   keep it in mg end to end, since the requester asked to track sodium.
