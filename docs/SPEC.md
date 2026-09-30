# Nutrition Label Tracker — Specification

This file is the contract between the tests and the code. Every acceptance
criterion (AC-1 … AC-20) is testable and maps to the requirement ids
(R-1 … R-7, F-1 … F-6) of §1. The tests import only `src/` modules and never
touch the network, the camera, the DOM or `localStorage` directly.

## 1. Requirements

### 1.1 From the requester (fixed)

- **R-1** The user takes a photo of the product's nutrition table.
- **R-2** AI OCR turns the photo into structured data, through an
  OpenAI-compatible endpoint the user configures (base URL, API key, model).
- **R-3** Everything after the OCR is deterministic: parsing, calculations
  and totals are plain code — no AI involved.
- **R-4** The user chooses their own custom mix of nutrients to track; the
  app is not locked to one goal or diet.
- **R-5** Meal planner: the user enters grams (or ml) per food and the app
  computes the dish's nutrition from the scanned products.
- **R-6** The app is free and shows no ads.
- **R-7** The OCR copes with multilingual labels, with per 100 g /
  per 100 ml / per portion columns, and with rotated, blurry or partly
  finger-covered photos.

### 1.2 Added features (from the brief's scope)

- **F-1** A review/correct screen is mandatory before saving a product;
  unreadable fields are highlighted; manual entry without a photo is allowed.
- **F-2** No accounts; data lives in `localStorage` with JSON export/import
  (the API key is never exported).
- **F-3** Saved nutrient selection; optional per-nutrient daily target
  (min/max) with progress.
- **F-4** Saved dishes; a simple day log (one day, browse by date) with
  totals vs targets.
- **F-5** Local-only "Tu uso" counters; no analytics.
- **F-6** OCR settings (base URL, API key, model) live in `localStorage`
  only; the browser calls the provider directly (no proxy); Ajustes explains
  the base URL, CORS and possible provider charges.

Every acceptance criterion in §9 maps to these ids.

## 2. Stack and repository layout

- Node 24, ES modules, **no build step, no dependencies**.
- `src/` — pure logic. Everything platform-specific (storage backend,
  `fetch`, the current date) is passed in as a parameter. No browser or Node
  APIs.
- `public/` — the user interface: HTML, CSS and ES modules that import
  `../src/`. All user-visible texts in **Spanish**.
- `tests/` — `node:test`; the only place the network is faked (fake
  `fetch`).
- `.github/workflows/ci.yml` — runs `npm test` on Node 24.
- `README.md`, `docs/SPEC.md`.
- Code, tests, docs and commit messages in English.
- The app is **served from the repository root** (e.g. `npx serve .` or
  `python3 -m http.server`) so that `public/` modules can import `../src/`.

## 3. Sample fixtures (from the three shared photos)

### F1 — Dr. Schär Melto (German label, EU comma decimals)

Package 90 g, portion 30 g. Two columns: per 100 g | per 30 g.

| Row (as printed) | per 100 g | per 30 g |
|---|---|---|
| Energie | 2292 kJ / 549 kcal | 688 kJ / 165 kcal |
| Fett | 33 g | 10 g |
| davon gesättigte Fettsäuren | 13 g | 3,9 g |
| Kohlenhydrate | 55 g | 16 g |
| davon Zucker | 45 g | 14 g |
| Ballaststoffe | 2,4 g | 0,7 g |
| Eiweiß | 6,8 g | 2,0 g |
| Salz | 0,18 g | 0,05 g |

Derived sodium: 0,18 g salt → **72 mg sodium per 100 g**; one portion computed
from the per-100 column → **21,6 mg sodium per 30 g** (rule 5.3; both within
1e-9, see rule 5.6).

### F2 — Dutch juice (1 L carton, glass = 200 ml)

Two value columns: per 100 ml | per glas (200 ml), **plus a second table of
%RI per glass that must be ignored**.

| Row (as printed) | per 100 ml | per glas (200 ml) |
|---|---|---|
| Energie | 199 kJ / 47 kcal | 399 kJ / 94 kcal |
| Vetten | 0 g | 0 g |
| waarvan verzadigde vetzuren | 0 g | 0 g |
| waarvan onverzadigde vetzuren | 0 g | 0 g |
| Koolhydraten | 11 g | 22 g |
| waarvan suikers | 10 g | 20 g |
| Vezels | 0,7 g | 1,4 g |
| Eiwitten | 0,4 g | 0,8 g |
| Zout | 0 g | 0 g |
| Vitamine C | 21 mg (26% RI) | — |

The "waarvan onverzadigde vetzuren" row maps to the catalog id `unsaturates`.
The 200 ml glass column is kept as the **portion column**. The separate
%RI-per-glass table (energy 5,0%, fat 0%, saturates 0%, carbohydrate 8,0%,
sugars 22%, salt 0%) is **discarded as a column**. Vitamin C is kept as an
extra `{name: "Vitamine C", amount: 21, unit: "mg", ri_percent: 26}` — amount
and RI exactly as printed per 100 ml; **no per-glass RI value is fabricated**.

### F3 — Olive oil spray (Dutch, 200 ml, rotated photo)

Only one column: per 100 ml.

| Row (as printed) | per 100 ml |
|---|---|
| Energie | 3404 kJ / 828 kcal |
| Vetten | 92 g |
| waarvan verzadigd | 14 g |
| Koolhydraten | 0 g |
| waarvan suikers | 0 g |
| Vezels | 0 g |
| Eiwitten | 0 g |
| Zout | 0 g |
| Vitamine E | 18 mg (150% RI) |

No portion column → `portion_size: null`, `portion: null`. Vitamin E is kept
as an extra `{name: "Vitamine E", amount: 18, unit: "mg", ri_percent: 150}`.

## 4. Nutrient catalog

Exactly these 13 ids, with Spanish names and display units:

| id | Spanish name | unit |
|---|---|---|
| `energy_kj` | Energía (kJ) | kJ |
| `energy_kcal` | Energía (kcal) | kcal |
| `fat` | Grasas | g |
| `saturates` | Grasas saturadas | g |
| `unsaturates` | Grasas insaturadas | g |
| `monounsaturates` | Grasas monoinsaturadas | g |
| `polyunsaturates` | Grasas poliinsaturadas | g |
| `carbohydrate` | Hidratos de carbono | g |
| `sugars` | Azúcares | g |
| `fibre` | Fibra | g |
| `protein` | Proteínas | g |
| `salt` | Sal | g |
| `sodium` | Sodio | **mg** |

Plus **extras**: `{name, amount, unit, ri_percent}` for anything else printed
on the label (vitamin C, vitamin E, …). An extra becomes trackable (selectable
in the nutrient selection) once it exists in a saved product.

## 5. Calculation rules (fixed)

- **5.1 kJ and kcal are stored exactly as printed, never converted.** If one
  of the two is missing it stays `null`.
- **5.2 Numbers** are parsed with comma or dot decimals (`"0,18"` → 0.18,
  `"2.4"` → 2.4). Missing or unreadable values are `null`; **`null` ≠ 0**;
  values are never invented.
- **5.3 Sodium is in mg end to end**: `nutrientValue(product, "sodium")`,
  dish totals, day totals and targets are all in mg. Derived sodium:
  `sodium_mg = salt_g / 2.5 * 1000`, unrounded (F1: 0.18 → 72 mg per 100 g;
  one 30 g portion → 21.6 mg; both within 1e-9, rule 5.6). Sodium printed on
  the label (in g or mg) is normalized to mg and wins over the derived value.
- **5.4 The calculation source is the per-100 g/ml column.** The portion
  column is kept as printed, plus the portion size. "1 porción" in the dish
  planner means `portion_size × per-100 value / 100` — for F1 carbohydrate
  that is 16.5 g, while the printed column says 16 g; **both are kept and the
  difference is expected**.
- **5.5 ml and g are never equated.** Each product has basis `"g"` or `"ml"`;
  dish amounts are entered in the product's basis. An optional per-product,
  user-entered density (g/ml) allows cross-basis amounts; there are **no
  hardcoded densities**.
- **5.6 Precision: no intermediate rounding.** All stored and computed values
  keep full double precision; rounding happens **only at presentation**.
  `round2(x) = Math.round(x * 100) / 100` exists for the UI only and is never
  applied to stored or intermediate values. Tests compare computed values
  with tolerance **1e-9**, and displayed (round2) values with tolerance
  **0.005**.
- **5.7 Unreadable convention:** a field whose value is `null` because it was
  unreadable is listed in `unreadable`; the Revisar screen highlights exactly
  those fields.
- **5.8 Target compare rule (no tolerance):** for a target `{min, max}` and a
  total `t`: if `t` is `null` → `"unknown"`; if `min != null` and `t < min` →
  `"under"`; if `max != null` and `t > max` → `"over"`; otherwise `"ok"`.
  (`min`: total >= target is ok, else under; `max`: total <= target is ok,
  else over.)

## 6. OCR

### 6.1 One path

The browser calls an OpenAI-compatible chat/completions endpoint directly:
base URL, API key and model are configured by the user in Ajustes, stored in
`localStorage` only, never proxied. The photo is sent as a base64 data URL.
Only the tests stand in for the network (fake `fetch`).

### 6.2 Prompt (`src/ocr-prompt.js`)

`OCR_PROMPT` instructs the model to: handle **rotated** photos (read the label
in any orientation), tolerate **blurry** areas and a **finger** covering part
of the label, read **multilingual** labels (DE/FR/NL/IT/EN/ES at least),
transcribe numbers exactly as printed (comma decimals included), mark anything
it cannot read as **unreadable** instead of guessing, and answer with strict
JSON only. The literal words `rotated`, `blurry`, `finger`, `multilingual` and
`unreadable` appear in the prompt (AC-7 checks this). Rotation/blur/finger are
**prompt duties plus the human Revisar step — never parser results**.

### 6.3 Model output schema (strict JSON)

```json
{
  "product_name": "string | null",
  "basis": "g | ml | null",
  "columns": [{"label": "string", "amount": "string | null", "unit": "string | null"}],
  "rows": [{"name": "string", "unit": "string | null", "values": ["string | null"], "ri": "string | null"}],
  "unreadable": ["string"],
  "notes": "string | null"
}
```

`values[i]` belongs to `columns[i]`; each value is the printed text, including
the printed unit when present (`"2292 kJ / 549 kcal"`, `"0,18"`, `"21"`).

### 6.4 Parser rules (`src/ocr-parse.js`, pure)

1. **Column detection.** The per-100 column is the column whose `amount`
   parses to 100 with unit g or ml, or whose label matches `/100\s*(g|ml)/i`;
   it is the calculation source. Any other column with a numeric `amount` and
   unit g/ml is the **portion column** (kept as printed; its amount is
   `portion_size`). A **%RI-only column** — every non-null value matches
   `/^\d+(?:[.,]\d+)?\s*%/` and no value contains g/mg/µg/kJ/kcal — is
   **discarded as a column**; rows with a g/mg/µg amount in a kept column and
   a percent in `ri` are still kept (vitamins become extras).
2. **Portion-only labels.** If no per-100 column exists but a portion column
   with a printed size (numeric `amount` in g or ml) exists, the per-100
   values are derived deterministically: `per100 = value × 100 / portion
   size`, and the normalized result is flagged `derived_from_portion: true`.
   kJ and kcal are derived the same way, each from its own printed portion
   value — **never converted between each other** (rule 5.1). If the portion
   size is missing or unreadable, throw `no_per100`. A printed per-100 column
   always takes precedence (flag `false`). Example (synthetic): columns
   `[{"label": "per portie (25 g)", "amount": "25", "unit": "g"}]`, rows
   Energie `["500 kJ / 120 kcal"]` and Vetten `["5"]` → `portion_size: 25`,
   `per100.energy_kj = 2000`, `per100.energy_kcal = 480`, `per100.fat = 20`,
   `derived_from_portion: true`, and `portion` keeps the printed values
   (`energy_kj: 500`, `energy_kcal: 120`, `fat: 5`).
3. **Name matching (exact).** Normalize the row name: lowercase; trim;
   NFD-normalize and remove combining marks (diacritics-insensitive);
   `ß`→`ss`; collapse internal whitespace to single spaces. Then remove one
   leading qualifier phrase if present: `davon`, `dont`, `waarvan`, `di cui`,
   `of which`. The result must **equal exactly** one alias in
   `NUTRIENT_ALIASES` (stored already normalized). Ids are tried in this
   order: energy, saturates, monounsaturates, polyunsaturates, unsaturates,
   fat, sugars, carbohydrate, fibre, protein, salt, sodium; the first exact
   match wins. Rows that match nothing become extras (rule 7) or are ignored.
   (The full forms with qualifier, e.g. `waarvan verzadigde vetzuren`, are
   also listed as aliases, so the match works with or without the
   prefix-stripping step.)
4. **Aliases** (`NUTRIENT_ALIASES`, already normalized):
   - energy: `energie`, `energy`, `energia`, `energiewaarde`, `brennwert`,
     `valeur energetique`, `valor energetico`
   - fat: `fett`, `vetten`, `vet`, `totaal vet`, `matieres grasses`,
     `grassi`, `grasas`, `fat`, `lipides`
   - saturates: `davon gesattigte fettsauren`, `gesattigte fettsauren`,
     `waarvan verzadigde vetzuren`, `verzadigde vetzuren`,
     `waarvan verzadigd`, `verzadigd vet`, `verz. vet`,
     `dont acides gras satures`, `acides gras satures`,
     `di cui acidi grassi saturi`, `grassi saturi`, `saturated fat`,
     `saturates`, `grasas saturadas`
   - unsaturates: `waarvan onverzadigde vetzuren`, `onverzadigde vetzuren`,
     `waarvan onverzadigd`, `onverzadigd vet`, `ungesattigte fettsauren`,
     `acides gras insatures`, `grassi insaturi`, `unsaturated fat`,
     `grasas insaturadas`
   - monounsaturates: `einfach ungesattigte fettsauren`,
     `mono-onverzadigde vetzuren`, `acides gras monoinsatures`,
     `grassi monoinsaturi`, `monounsaturated fat`, `grasas monoinsaturadas`
   - polyunsaturates: `mehrfach ungesattigte fettsauren`,
     `meervoudig onverzadigde vetzuren`, `acides gras polyinsatures`,
     `grassi polinsaturi`, `polyunsaturated fat`, `grasas poliinsaturadas`
   - carbohydrate: `kohlenhydrate`, `koolhydraten`, `glucides`, `carboidrati`,
     `carbohydrate`, `carbohydrates`, `hidratos de carbono`, `carbohidratos`
   - sugars: `davon zucker`, `zucker`, `waarvan suikers`, `suikers`,
     `dont sucres`, `sucres`, `di cui zuccheri`, `zuccheri`, `sugars`,
     `azucares`
   - fibre: `ballaststoffe`, `voedingsvezels`, `vezels`,
     `fibres alimentaires`, `fibres`, `fibre alimentari`, `fibre`, `fiber`,
     `fibra`
   - protein: `eiweiss`, `eiwit`, `eiwitten`, `proteinen`, `proteines`,
     `proteine`, `protein`, `proteinas`
   - salt: `salz`, `zout`, `sel`, `sale`, `salt`, `sal`
   - sodium: `natrium`, `sodium`, `sodio`
5. **Energy split.** `"X kJ / Y kcal"` is split with
   `/(\d+(?:[.,]\d+)?)\s*kJ\s*[\/\-–|]\s*(\d+(?:[.,]\d+)?)\s*kcal/i` and the
   reversed-order variant with kcal first; a lone `… kJ` or `… kcal` fills
   only its own field and leaves the other `null` (rule 5.1).
6. **Units.** `µg`, `μg`, `mcg`, `ug` normalize to `µg`; `mg`→`mg`, `g`→`g`,
   `kJ`→`kJ`, `kcal`→`kcal`. Core nutrients are stored in g (a value printed
   in mg is divided by 1000) **except sodium, stored in mg** (printed g ×
   1000, printed mg as-is). Extras keep their printed (normalized) unit.
7. **Extras.** Rows matching no catalog id with an amount in g/mg/µg become
   `{name (as printed), amount (number), unit, ri_percent (number|null)}`.
   When summing extras in totals, only equal units add up; mixed units make
   the total `null` (unknown).
8. **Typed errors.** `OcrParseError` (extends `Error`, `.code`):
   `not_json` (input not valid JSON / not an object),
   `missing_columns` (no columns array or empty),
   `no_per100` (no per-100 column and no usable portion column, rule 2),
   `bad_rows` (rows missing or not an array).
   Messages in Spanish, e.g. `"La respuesta no es un JSON válido."`,
   `"No se encontró la columna por 100 g/ml."`.

### 6.5 Executable fixtures (raw model JSON → exact normalized output)

Normalized output shape:

```json
{
  "name": "string | null",
  "basis": "g | ml",
  "portion_size": "number | null",
  "derived_from_portion": false,
  "per100": {"energy_kj": 0, "…all 13 catalog ids…": "number | null"},
  "portion": "same shape as per100 | null",
  "extras": [{"name": "string", "amount": 0, "unit": "g|mg|µg", "ri_percent": "number | null"}],
  "unreadable": ["string"],
  "notes": "string | null"
}
```

`per100` and `portion` always contain all 13 catalog ids; unmatched rows stay
`null`. `sodium` is `null` here (it is derived later by `nutrientValue`).
`derived_from_portion` is `false` for F1, F2 and F3 (all have a printed
per-100 column).

**F1 raw:**

```json
{
  "product_name": "Dr. Schär Melto",
  "basis": "g",
  "columns": [
    {"label": "per 100 g", "amount": "100", "unit": "g"},
    {"label": "per 30 g", "amount": "30", "unit": "g"}
  ],
  "rows": [
    {"name": "Energie", "unit": null, "values": ["2292 kJ / 549 kcal", "688 kJ / 165 kcal"], "ri": null},
    {"name": "Fett", "unit": "g", "values": ["33", "10"], "ri": null},
    {"name": "davon gesättigte Fettsäuren", "unit": "g", "values": ["13", "3,9"], "ri": null},
    {"name": "Kohlenhydrate", "unit": "g", "values": ["55", "16"], "ri": null},
    {"name": "davon Zucker", "unit": "g", "values": ["45", "14"], "ri": null},
    {"name": "Ballaststoffe", "unit": "g", "values": ["2,4", "0,7"], "ri": null},
    {"name": "Eiweiß", "unit": "g", "values": ["6,8", "2,0"], "ri": null},
    {"name": "Salz", "unit": "g", "values": ["0,18", "0,05"], "ri": null}
  ],
  "unreadable": [],
  "notes": null
}
```

**F1 normalized:**

```json
{
  "name": "Dr. Schär Melto",
  "basis": "g",
  "portion_size": 30,
  "derived_from_portion": false,
  "per100": {
    "energy_kj": 2292, "energy_kcal": 549, "fat": 33, "saturates": 13,
    "unsaturates": null, "monounsaturates": null, "polyunsaturates": null,
    "carbohydrate": 55, "sugars": 45, "fibre": 2.4, "protein": 6.8,
    "salt": 0.18, "sodium": null
  },
  "portion": {
    "energy_kj": 688, "energy_kcal": 165, "fat": 10, "saturates": 3.9,
    "unsaturates": null, "monounsaturates": null, "polyunsaturates": null,
    "carbohydrate": 16, "sugars": 14, "fibre": 0.7, "protein": 2,
    "salt": 0.05, "sodium": null
  },
  "extras": [],
  "unreadable": [],
  "notes": null
}
```

**F2 raw** (the third column is the label's second table — %RI per glass —
with its real percentages; it must be discarded as a column. Vitamin C keeps
its per-100-ml amount 21 mg and ri "26"; no per-glass RI value is invented):

```json
{
  "product_name": "Sinasappelsap",
  "basis": "ml",
  "columns": [
    {"label": "per 100 ml", "amount": "100", "unit": "ml"},
    {"label": "per glas (200 ml)", "amount": "200", "unit": "ml"},
    {"label": "%RI per glas", "amount": null, "unit": null}
  ],
  "rows": [
    {"name": "Energie", "unit": null, "values": ["199 kJ / 47 kcal", "399 kJ / 94 kcal", "5,0%"], "ri": null},
    {"name": "Vetten", "unit": "g", "values": ["0", "0", "0%"], "ri": null},
    {"name": "waarvan verzadigde vetzuren", "unit": "g", "values": ["0", "0", "0%"], "ri": null},
    {"name": "waarvan onverzadigde vetzuren", "unit": "g", "values": ["0", "0", null], "ri": null},
    {"name": "Koolhydraten", "unit": "g", "values": ["11", "22", "8,0%"], "ri": null},
    {"name": "waarvan suikers", "unit": "g", "values": ["10", "20", "22%"], "ri": null},
    {"name": "Vezels", "unit": "g", "values": ["0,7", "1,4", null], "ri": null},
    {"name": "Eiwitten", "unit": "g", "values": ["0,4", "0,8", null], "ri": null},
    {"name": "Zout", "unit": "g", "values": ["0", "0", "0%"], "ri": null},
    {"name": "Vitamine C", "unit": "mg", "values": ["21", null, null], "ri": "26"}
  ],
  "unreadable": [],
  "notes": "1 L pak"
}
```

**F2 normalized:**

```json
{
  "name": "Sinasappelsap",
  "basis": "ml",
  "portion_size": 200,
  "derived_from_portion": false,
  "per100": {
    "energy_kj": 199, "energy_kcal": 47, "fat": 0, "saturates": 0,
    "unsaturates": 0, "monounsaturates": null, "polyunsaturates": null,
    "carbohydrate": 11, "sugars": 10, "fibre": 0.7, "protein": 0.4,
    "salt": 0, "sodium": null
  },
  "portion": {
    "energy_kj": 399, "energy_kcal": 94, "fat": 0, "saturates": 0,
    "unsaturates": 0, "monounsaturates": null, "polyunsaturates": null,
    "carbohydrate": 22, "sugars": 20, "fibre": 1.4, "protein": 0.8,
    "salt": 0, "sodium": null
  },
  "extras": [
    {"name": "Vitamine C", "amount": 21, "unit": "mg", "ri_percent": 26}
  ],
  "unreadable": [],
  "notes": "1 L pak"
}
```

**F3 raw** (rotated photo; the model handles the rotation, the parser only
sees this JSON):

```json
{
  "product_name": "Olijfolie spray",
  "basis": "ml",
  "columns": [
    {"label": "per 100 ml", "amount": "100", "unit": "ml"}
  ],
  "rows": [
    {"name": "Energie", "unit": null, "values": ["3404 kJ / 828 kcal"], "ri": null},
    {"name": "Vetten", "unit": "g", "values": ["92"], "ri": null},
    {"name": "waarvan verzadigd", "unit": "g", "values": ["14"], "ri": null},
    {"name": "Koolhydraten", "unit": "g", "values": ["0"], "ri": null},
    {"name": "waarvan suikers", "unit": "g", "values": ["0"], "ri": null},
    {"name": "Vezels", "unit": "g", "values": ["0"], "ri": null},
    {"name": "Eiwitten", "unit": "g", "values": ["0"], "ri": null},
    {"name": "Zout", "unit": "g", "values": ["0"], "ri": null},
    {"name": "Vitamine E", "unit": "mg", "values": ["18"], "ri": "150"}
  ],
  "unreadable": [],
  "notes": "Foto geroteerd; spray 200 ml"
}
```

**F3 normalized:**

```json
{
  "name": "Olijfolie spray",
  "basis": "ml",
  "portion_size": null,
  "derived_from_portion": false,
  "per100": {
    "energy_kj": 3404, "energy_kcal": 828, "fat": 92, "saturates": 14,
    "unsaturates": null, "monounsaturates": null, "polyunsaturates": null,
    "carbohydrate": 0, "sugars": 0, "fibre": 0, "protein": 0,
    "salt": 0, "sodium": null
  },
  "portion": null,
  "extras": [
    {"name": "Vitamine E", "amount": 18, "unit": "mg", "ri_percent": 150}
  ],
  "unreadable": [],
  "notes": "Foto geroteerd; spray 200 ml"
}
```

### 6.6 `extractLabel` HTTP contract (exact)

```js
const url = settings.baseUrl.replace(/\/+$/, "") + "/chat/completions";
const response = await fetch(url, {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + settings.apiKey,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: settings.model,
    messages: buildOcrMessages(imageDataUrl),
    response_format: { type: "json_object" },
    temperature: 0
  })
});
```

The content is read from `data.choices[0].message.content` and parsed as JSON,
then passed to `parseOcrResponse`. `OcrClientError` (extends `Error`, `.code`,
`.status` when relevant) with Spanish messages:

| code | condition | Spanish message |
|---|---|---|
| `network` | `fetch` rejects (down, DNS, CORS block) | `No se pudo conectar con el servidor. Revisa la URL y tu conexión; si la URL es correcta, puede ser un bloqueo CORS del proveedor.` |
| `auth` | HTTP 401 | `La clave de API no es válida (error 401).` |
| `rate_limit` | HTTP 429 | `Límite de peticiones alcanzado (error 429). Inténtalo de nuevo en unos segundos.` |
| `http` | any other non-2xx | `El servidor respondió con un error (HTTP {status}).` |
| `empty` | no `choices[0].message.content` | `El modelo no devolvió ningún texto.` |
| `invalid_json` | content is not valid JSON, or `parseOcrResponse` throws | `La respuesta del modelo no es un JSON válido.` |

Ajustes explains: the URL is the **base** of an OpenAI-compatible API (for
example `https://api.openai.com/v1` — the app appends `/chat/completions`);
that the browser calls the provider directly, so the provider must allow
**CORS** from the page's origin (if not, the request fails with the network
error above); and that **the user's provider may charge** for each scan
according to the user's own plan.

## 7. Modules (`src/`), signatures and AC ids

### `src/nutrients.js`
- `NUTRIENTS` — array of the 13 `{id, name_es, unit}` of §4, in that order. (AC-13)
- `NUTRIENT_ALIASES` — `{id: string[]}` of §6.4 rule 4, already normalized. (AC-2, AC-18)
- `getNutrient(id)` → `{id, name_es, unit} | null`. (AC-13)
- `parseNumber(str)` → `number | null`; comma and dot decimals; `""`, `null`,
  unreadable text → `null`. (AC-5)
- `round2(x)` → `Math.round(x * 100) / 100`; **presentation only** — the UI
  formats with it, `src/` never rounds stored or intermediate values. (AC-20)
- `saltToSodiumMg(saltG)` → `null | saltG / 2.5 * 1000` (unrounded); example:
  `saltToSodiumMg(0.18)` = 72 ± 1e-9. (AC-6)
- `scalePer100(value, amount)` → `null | value * amount / 100` (unrounded);
  example: `scalePer100(55, 30)` → `16.5`. (AC-11, AC-20)
- `convertAmount({value, from, to, density})` → same basis: `value`; cross
  g↔ml with a user density (g/ml): `value * density` or `value / density`
  (unrounded); cross-basis without density: `null`. (AC-12)

### `src/ocr-prompt.js`
- `OCR_PROMPT` — the prompt string of §6.2. (AC-7)
- `buildOcrMessages(imageDataUrl)` → the `messages` array:
  `[{role: "system", content: OCR_PROMPT}, {role: "user", content: [{type: "text", text: "…"}, {type: "image_url", image_url: {url: imageDataUrl}}]}]`. (AC-8)

### `src/ocr-parse.js`
- `class OcrParseError extends Error` with `.code` (§6.4 rule 8). (AC-10)
- `parseOcrResponse(raw)` — accepts the raw content **string or an already
  parsed object**; returns the normalized label of §6.5; throws
  `OcrParseError` on malformed input. (AC-1, AC-2, AC-3, AC-4, AC-10, AC-18, AC-19)

### `src/ocr-client.js`
- `class OcrClientError extends Error` with `.code` and `.status`. (AC-9)
- `async extractLabel({fetch, settings, imageDataUrl})` — `settings` is
  `{baseUrl, apiKey, model}`; performs exactly the call of §6.6 and returns
  the normalized label. `fetch` is always a parameter; tests pass a fake. (AC-8, AC-9)

### `src/products.js`
- `createProduct(data, meta)` — pure; `data` is the reviewed label
  (`{name, basis, portion_size, derived_from_portion, per100, portion, extras, notes}`)
  plus optional `{density}`; `meta` is `{id, createdAt}` (injected, so the
  function stays pure); returns the product. (AC-14)
- `saveProduct(storage, product)`, `getProduct(storage, id)`,
  `listProducts(storage)`, `deleteProduct(storage, id)` — CRUD over the
  injected storage. (AC-14)
- `nutrientValue(product, key)` — `key` is a catalog id or an extra name;
  returns the per-100 value. For `"sodium"`: the printed sodium (mg) if
  present, else `saltToSodiumMg(per100.salt)`. Example: F1 → 72 ± 1e-9. (AC-6, AC-14)

### `src/dish.js`
- `portionAmount(product, portions)` → `product.portion_size * portions`
  (unrounded) in the product's basis; `null` when `portion_size` is `null`. (AC-11)
- `computeDishTotals(items, selection)` — `items`:
  `[{product, amount}]` with `amount` in the product's basis; returns
  `{key: number | null}` for each key in `selection`, summing
  `scalePer100(nutrientValue(product, key), amount)`; any `null` contribution
  makes that total `null` (unknown), never 0. Extras sum only within equal
  units. Example: 30 g of F1 → `carbohydrate: 16.5`, `sodium: 21.6 ± 1e-9`. (AC-11)

### `src/tracking.js`
- `DEFAULT_SELECTION` — `["energy_kcal", "fat", "saturates", "carbohydrate", "sugars", "fibre", "protein", "salt"]`. (AC-13)
- `sanitizeSelection(ids, extraNames)` — keeps valid catalog ids and existing
  extra names, dedupes, preserves order. (AC-13)
- `evaluateTarget(total, target)` — `target`: `{min: number|null, max: number|null}`;
  returns `"ok" | "under" | "over" | "unknown"` by rule 5.8, or `null` when
  the target has neither min nor max. (AC-15)

### `src/log.js`
- `dateKey(date)` → `"YYYY-MM-DD"` (local date). (AC-17)
- `computeDayTotals(entries, products, selection)` — `entries`:
  `[{productId, amount}]`; same math as `computeDishTotals`. (AC-17)
- `compareWithTargets(totals, targets)` → `{key: "ok"|"under"|"over"|"unknown"|null}`
  applying `evaluateTarget` per key. (AC-15, AC-17)

### `src/storage.js`
- `createStorage(backend)` — `backend` is any object with
  `getItem(key)`, `setItem(key, value)`, `removeItem(key)` (`localStorage` in
  the app, a Map-based fake in tests); returns
  `{load(key, fallback), save(key, value), exportAll(), importAll(json)}`. (AC-16)
- Keys: `nlt:products`, `nlt:dishes`, `nlt:log`, `nlt:selection`,
  `nlt:targets`, `nlt:settings`, `nlt:usage`.
- `exportAll()` → a JSON string with all keys; `settings` is included
  **without `apiKey`** — the key never leaves the device. (AC-16)
- `importAll(json)` → validates the top-level shape, replaces the keys
  present, **ignores any `apiKey`** inside `settings`; throws on invalid
  JSON. (AC-16)

## 8. User interface (`public/`, all texts in Spanish)

Six screens; every screen shows the footer **"Gratis y sin anuncios"** (R-6).

- **Escanear** — camera capture (`input[type=file][capture]`) → base64 data
  URL → `extractLabel({fetch: window.fetch, settings, imageDataUrl})` →
  Revisar. `OcrClientError` Spanish messages are shown verbatim. A button
  "Introducir manualmente" opens Revisar with an empty label (F-1).
- **Revisar** — mandatory before saving (F-1). Editable form of the
  normalized label: name, basis (g/ml), portion size, per-100 and portion
  columns as printed, extras; fields listed in `unreadable` are highlighted
  (rule 5.7). "Guardar" → `createProduct(data, {id: crypto.randomUUID(),
  createdAt: new Date().toISOString()})` → `saveProduct`; "Descartar"
  discards. No other path saves a product.
- **Productos** — `listProducts`; edit density (optional, per product);
  `deleteProduct`; pick products for Plato.
- **Plato** — add saved products with an amount in the product's basis or a
  number of portions (`portionAmount`); totals via
  `computeDishTotals(items, selection)`; "Guardar plato" stores the dish
  (F-4); "Añadir al día" appends its items to the day log.
- **Hoy** — `dateKey(new Date())`, browse by date; entries listed; totals via
  `computeDayTotals`; progress vs targets via `compareWithTargets` (F-3, F-4).
- **Ajustes** — OCR settings (base URL, API key, model; `localStorage` only)
  with the explanations of §6.6 (base URL e.g. `https://api.openai.com/v1`,
  CORS, possible provider charges); nutrient selection (`sanitizeSelection`,
  R-4); per-nutrient targets min/max (F-3); JSON export/import
  (`exportAll`/`importAll`, F-2); "Tu uso" counters (scans, products, dishes,
  logged days — local only, F-5).

## 9. Acceptance criteria

Each AC is automated (`node:test`, fake `fetch`, injected storage) unless it
says manual. **R-6 and F-5 are verified by repository inspection**: no
advertising, account or analytics code anywhere; "Tu uso" counters never
leave `nlt:usage`.

- **AC-1 (R-3, R-7):** `parseOcrResponse` on the F1 raw fixture returns
  exactly the F1 normalized output of §6.5 (per-100 as source, portion column
  as printed, comma decimals parsed, `derived_from_portion: false`).
- **AC-2 (R-3, R-7):** F2 raw → exactly F2 normalized: the 200 ml glass
  column is the portion column; the percent-only %RI column is discarded;
  vitamin C is the extra `{name: "Vitamine C", amount: 21, unit: "mg",
  ri_percent: 26}`; `unsaturates: 0`.
- **AC-3 (R-3, R-7):** F3 raw → exactly F3 normalized: `portion_size: null`,
  `portion: null`, vitamin E extra `{amount: 18, unit: "mg", ri_percent: 150}`.
- **AC-4 (R-3):** kJ and kcal are stored exactly as printed and never
  converted between each other; a lone `… kJ` or `… kcal` fills only its own
  field, the other stays `null`.
- **AC-5 (R-3):** `parseNumber` accepts comma and dot decimals;
  missing/unreadable → `null`; `null` is never treated as 0 and no value is
  invented; unreadable fields are listed in `unreadable`.
- **AC-6 (R-3):** sodium is in mg end to end: `saltToSodiumMg(0.18)` =
  72 ± 1e-9; `nutrientValue(F1, "sodium")` = 72 ± 1e-9; 30 g of F1 → sodium
  21.6 ± 1e-9; sodium printed in g or mg is normalized to mg and wins over
  the derived value.
- **AC-7 (R-7, F-1):** `OCR_PROMPT` contains the literal words `rotated`,
  `blurry`, `finger`, `multilingual`, `unreadable`. Rotation/blur/finger
  robustness is a prompt duty plus the human Revisar step; the parser's ACs
  cover JSON only (photo robustness itself: §10, manual).
- **AC-8 (R-1, R-2, F-6):** `extractLabel` with a fake `fetch` performs
  exactly the call of §6.6: base URL with trailing slashes stripped +
  `/chat/completions`, POST, headers `Authorization: Bearer <key>` and
  `Content-Type: application/json`, body `{model, messages,
  response_format: {type: "json_object"}, temperature: 0}`; the answer is
  read from `choices[0].message.content`, parsed as JSON and normalized.
- **AC-9 (R-2, F-6):** `extractLabel` maps failures to `OcrClientError` with
  codes `network` (fetch rejects), `auth` (401), `rate_limit` (429), `http`
  (other non-2xx, with `.status`), `empty` (no content), `invalid_json` (bad
  JSON or parser error) and the Spanish messages of §6.6.
- **AC-10 (R-3):** malformed model output throws `OcrParseError` with code
  `not_json` (not JSON / not an object), `missing_columns` (no/empty columns
  array), `no_per100` (no per-100 column and no usable portion column),
  `bad_rows` (rows missing or not an array).
- **AC-11 (R-5):** dish math uses the per-100 column: `scalePer100(55, 30)` =
  16.5; "1 porción" of F1 = 30 g × per-100/100 → carbohydrate 16.5 while the
  printed portion column says 16 (both kept); a `null` contribution makes
  that nutrient's total `null`, never 0; extras sum only within equal units.
- **AC-12 (R-5):** ml and g are never equated: `convertAmount` returns the
  value unchanged within one basis, converts g↔ml only with a user-entered
  density, returns `null` cross-basis without density; no hardcoded densities
  exist in the repository.
- **AC-13 (R-4):** the catalog has exactly the 13 ids of §4 with Spanish
  names and units; `DEFAULT_SELECTION` as specified; `sanitizeSelection`
  keeps valid catalog ids and existing extra names, dedupes and preserves
  order — the tracked mix is fully user-chosen.
- **AC-14 (R-3, F-2):** `createProduct(data, {id, createdAt})` is pure (id
  and date injected); `saveProduct`/`getProduct`/`listProducts`/
  `deleteProduct` work over an injected storage backend; `nutrientValue`
  returns per-100 values and derives sodium in mg.
- **AC-15 (F-3):** `evaluateTarget` implements rule 5.8 exactly — min:
  total ≥ min → ok, else under; max: total ≤ max → ok, else over; `null`
  total → `unknown`; no tolerance; `compareWithTargets` applies it per key.
- **AC-16 (F-2):** `createStorage` over a Map-based fake: `load`/`save`
  round-trip; `exportAll` returns all keys and **omits the API key**;
  `importAll` validates the JSON, restores the data and ignores any `apiKey`.
- **AC-17 (F-4):** `dateKey` → `YYYY-MM-DD`; `computeDayTotals` matches
  `computeDishTotals` math; day totals compare against targets via
  `compareWithTargets`.
- **AC-18 (R-7):** name matching follows §6.4 rule 3 exactly (lowercase,
  trim, diacritics-insensitive, leading `davon`/`dont`/`waarvan`/`di cui`/
  `of which` removed, exact alias match): `waarvan verzadigde vetzuren` →
  `saturates`, `waarvan onverzadigde vetzuren` → `unsaturates`,
  `davon gesättigte Fettsäuren` → `saturates`;
  `monounsaturates`/`polyunsaturates` stay `null` unless printed.
- **AC-19 (R-7):** portion-only labels: with no per-100 column but a portion
  column with a printed size, per-100 values are derived as
  `value × 100 / portion size` and flagged `derived_from_portion: true` (kJ
  and kcal derived independently, never converted); missing/unreadable
  portion size → `no_per100`; a printed per-100 column always takes
  precedence (flag `false`). The synthetic example of §6.4 rule 2 holds
  exactly.
- **AC-20 (R-3):** precision: no intermediate rounding anywhere in `src/`;
  `round2` is used by the UI only; tests compare computed values with
  tolerance 1e-9 and displayed (round2) values with tolerance 0.005.

## 10. Manual acceptance (with a real provider)

The automated tests never touch the network and **cannot prove the photo
robustness** of R-7 (rotation, blur, fingers, lighting, real cameras). With a
real OpenAI-compatible provider configured in Ajustes, run:

- **MA-1 (F1 photo):** Escanear → OCR → Revisar shows the F1 values of §3 →
  save → Plato with 30 g → totals: carbohydrate 16.5 g, sodium 21.6 mg
  (displayed, ±0.005).
- **MA-2 (F2 photo):** → Revisar shows the per-100 ml column, the 200 ml
  glass column and the vitamin C extra (21 mg, 26% RI); no %RI column →
  save → Plato with 200 ml → energy 94 kcal, sugars 20 g.
- **MA-3 (F3 photo, rotated):** → Revisar shows the per-100 ml values and the
  vitamin E extra (18 mg, 150% RI) → save → Plato with 10 ml → fat 9.2 g.
- **MA-4 (unreadable recovery):** photograph a label with part of the table
  covered or illegible → the OCR marks those fields unreadable → Revisar
  highlights them → the user fills them in or leaves them empty → saving
  works either way; empty fields stay `null` and their totals show
  "desconocido", never 0.
- **MA-5 (manual entry, F-1):** Revisar reached without a photo ("Introducir
  manualmente") → all fields typed by hand → save works.

## 11. Open questions for the requester (with the defaults the app ships)

1. **App language** — default: Spanish (all UI texts).
2. **Platform** — default: mobile web (static hosting, served from the repo
   root).
3. **OCR cost** — default: the user's own provider and key; Ajustes explains
   the provider may charge per scan.
4. **Targets and day log** — default: included, optional to use.
5. **Liquids in the planner** — default: amounts in the product's own basis;
   optional per-product, user-entered density; no hardcoded densities.
6. **Sodium** — default: derived from salt ÷ 2.5, shown in mg; printed sodium
   wins when present.
