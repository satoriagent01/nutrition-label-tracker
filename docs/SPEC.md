# Nutrition Label Tracker — Specification

This file is the contract between the tests and the code. Every acceptance
criterion (AC-1 … AC-20) is testable; the tests import only `src/` modules and
never touch the network, the camera, the DOM or `localStorage` directly.

## 1. Requirements (fixed, from the requester)

- **R-1** Scan a nutrition-label photo and turn it into structured data (OCR
  through an OpenAI-compatible endpoint the user configures).
- **R-2** A review/correct screen is mandatory before saving; manual entry
  without a photo is allowed.
- **R-3** Save products in a local catalog.
- **R-4** Build a dish ("plato") from saved products with amounts in each
  product's own basis (g or ml) and see totals of the chosen nutrients.
- **R-5** Saved nutrient selection; optional per-nutrient daily target
  (min/max) with progress.
- **R-6** Saved dishes; a simple day log (one day, browse by date) with totals
  vs targets.
- **R-7** No accounts; data in `localStorage` with JSON export/import;
  local-only "Tu uso" counters; no analytics; free, no ads.

## 2. Stack and repository layout

- Node 24, ES modules, **no build step, no dependencies**.
- `src/` — pure logic. Everything platform-specific (storage backend, `fetch`,
  the current date) is passed in as a parameter. No browser or Node APIs.
- `public/` — the user interface: HTML, CSS and ES modules that import
  `../src/`. All user-visible texts in **Spanish**.
- `tests/` — `node:test`; the only place the network is faked (fake `fetch`).
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
from the per-100 column → **21,6 mg sodium per 30 g** (see rule 5.4).

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
The 200 ml glass column is kept as the **portion column**. The %RI table is
discarded as a column; vitamin C is kept as an extra
`{name: "Vitamine C", amount: 21, unit: "mg", ri_percent: 26}`.

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
  `sodium_mg = salt_g / 2.5 * 1000` (F1: 0.18 → 72 mg per 100 g; one 30 g
  portion → 21.6 mg). Sodium printed on the label (in g or mg) is normalized
  to mg and wins over the derived value.
- **5.4 The calculation source is the per-100 g/ml column.** The portion
  column is kept as printed, plus the portion size. "1 porción" in the dish
  planner means `portion_size × per-100 value / 100` — for F1 carbohydrate
  that is 16.5 g, while the printed column says 16 g; **both are kept and the
  difference is expected**.
- **5.5 ml and g are never equated.** Each product has basis `"g"` or `"ml"`;
  dish amounts are entered in the product's basis. An optional per-product,
  user-entered density (g/ml) allows cross-basis amounts; there are **no
  hardcoded densities**.
- **5.6 Rounding:** every computed value is rounded with
  `Math.round(x * 100) / 100` (exported as `round2`) so tests compare with
  exact equality.
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
   **discarded as a column**; rows with a g/mg/µg amount in the per-100 column
   and a percent in `ri` are still kept (vitamins become extras).
2. **Name matching.** Row names are normalized (lowercase, NFD diacritics
   stripped, `ß`→`ss`, whitespace collapsed) and matched against
   `NUTRIENT_ALIASES` in this order: energy, saturates, monounsaturates,
   polyunsaturates, unsaturates, fat, sugars, carbohydrate, fibre, protein,
   salt, sodium. A row matches when its normalized name equals an alias or
   starts with it followed by a space or parenthesis.
3. **Aliases** (`NUTRIENT_ALIASES`, already normalized):
   - energy: `energie`, `energy`, `energia`, `energiewaarde`, `brennwert`,
     `valeur energetique`, `valor energetico`
   - fat: `fett`, `vetten`, `vet`, `matieres grasses`, `grassi`, `grasas`,
     `fat`, `lipides`
   - saturates: `davon gesattigte fettsauren`, `gesattigte fettsauren`,
     `waarvan verzadigd`, `verzadigde vetzuren`, `dont acides gras satures`,
     `acides gras satures`, `di cui acidi grassi saturi`, `grassi saturi`,
     `saturated fat`, `saturates`, `grasas saturadas`
   - unsaturates: `waarvan onverzadigd`, `onverzadigde vetzuren`,
     `ungesattigte fettsauren`, `acides gras insatures`, `grassi insaturi`,
     `unsaturated fat`, `grasas insaturadas`
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
4. **Energy split.** `"X kJ / Y kcal"` is split with
   `/(\d+(?:[.,]\d+)?)\s*kJ\s*[\/\-–|]\s*(\d+(?:[.,]\d+)?)\s*kcal/i` and the
   reversed-order variant with kcal first; a lone `… kJ` or `… kcal` fills only
   its own field and leaves the other `null` (rule 5.1).
5. **Units.** `µg`, `μg`, `mcg`, `ug` normalize to `µg`; `mg`→`mg`, `g`→`g`,
   `kJ`→`kJ`, `kcal`→`kcal`. Core nutrients are stored in g (a value printed
   in mg is divided by 1000) **except sodium, stored in mg** (printed g ×
   1000, printed mg as-is). Extras keep their printed (normalized) unit.
6. **Extras.** Rows matching no catalog id with an amount in g/mg/µg become
   `{name (as printed), amount (number), unit, ri_percent (number|null)}`.
   When summing extras in totals, only equal units add up; mixed units make
   the total `null` (unknown).
7. **Typed errors.** `OcrParseError` (extends `Error`, `.code`):
   `not_json` (input not valid JSON / not an object),
   `missing_columns` (no columns array or empty),
   `no_per100` (no per-100 column found),
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
  "per100": {"energy_kj": 0, "…all 13 catalog ids…": "number | null"},
  "portion": "same shape as per100 | null",
  "extras": [{"name": "string", "amount": 0, "unit": "g|mg|µg", "ri_percent": "number | null"}],
  "unreadable": ["string"],
  "notes": "string | null"
}
```

`per100` and `portion` always contain all 13 catalog ids; unmatched rows stay
`null`. `sodium` is `null` here (it is derived later by `nutrientValue`).

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

**F2 raw** (note the third, %RI-only column — the second table on the label):

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
    {"name": "Energie", "unit": null, "values": ["199 kJ / 47 kcal", "399 kJ / 94 kcal", null], "ri": null},
    {"name": "Vetten", "unit": "g", "values": ["0", "0", "0%"], "ri": null},
    {"name": "waarvan verzadigde vetzuren", "unit": "g", "values": ["0", "0", null], "ri": null},
    {"name": "waarvan onverzadigde vetzuren", "unit": "g", "values": ["0", "0", null], "ri": null},
    {"name": "Koolhydraten", "unit": "g", "values": ["11", "22", null], "ri": null},
    {"name": "waarvan suikers", "unit": "g", "values": ["10", "20", null], "ri": null},
    {"name": "Vezels", "unit": "g", "values": ["0,7", "1,4", null], "ri": null},
    {"name": "Eiwitten", "unit": "g", "values": ["0,4", "0,8", null], "ri": null},
    {"name": "Zout", "unit": "g", "values": ["0", "0", null], "ri": null},
    {"name": "Vitamine C", "unit": "mg", "values": ["21", null, "26%"], "ri": "26"}
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
- `NUTRIENT_ALIASES` — `{id: string[]}` of §6.4.3. (AC-2, AC-18)
- `getNutrient(id)` → `{id, name_es, unit} | null`. (AC-13)
- `parseNumber(str)` → `number | null`; comma and dot decimals; `""`, `null`,
  unreadable text → `null`. (AC-5)
- `round2(x)` → `Math.round(x * 100) / 100`. (AC-11)
- `saltToSodiumMg(saltG)` → `null | round2(saltG / 2.5 * 1000)`; example:
  `saltToSodiumMg(0.18)` → `72`. (AC-6)
- `scalePer100(value, amount)` → `null | round2(value * amount / 100)`;
  example: `scalePer100(55, 30)` → `16.5`. (AC-11)
- `convertAmount({value, from, to, density})` → same basis: `value`; cross
  g↔ml with a user density (g/ml): `round2(value * density)` or
  `round2(value / density)`; cross-basis without density: `null`. (AC-12)

### `src/ocr-prompt.js`
- `OCR_PROMPT` — the prompt string of §6.2. (AC-7)
- `buildOcrMessages(imageDataUrl)` → the `messages` array:
  `[{role: "system", content: OCR_PROMPT}, {role: "user", content: [{type: "text", text: "…"}, {type: "image_url", image_url: {url: imageDataUrl}}]}]`. (AC-8)

### `src/ocr-parse.js`
- `class OcrParseError extends Error` with `.code` (§6.4.7). (AC-9)
- `parseOcrResponse(raw)` — accepts the raw content **string or an already
  parsed object**; returns the normalized label of §6.5; throws
  `OcrParseError` on malformed input. (AC-1, AC-2, AC-3, AC-4, AC-10, AC-18)

### `src/ocr-client.js`
- `class OcrClientError extends Error` with `.code` and `.status`. (AC-9)
- `async extractLabel({fetch, settings, imageDataUrl})` — `settings` is
  `{baseUrl, apiKey, model}`; performs exactly the call of §6.6 and returns
  the normalized label. `fetch` is always a parameter; tests pass a fake. (AC-8, AC-9)

### `src/products.js`
- `createProduct(data, meta)` — pure; `data` is the reviewed label
  (`{name, basis, portion_size, per100, portion, extras, notes}`) plus
  optional `{density}`; `meta` is `{id, createdAt}` (injected, so the function
  stays pure); returns the product. (AC-14)
- `saveProduct(storage, product)`, `getProduct(storage, id)`,
  `listProducts(storage)`, `deleteProduct(storage, id)` — CRUD over the
  injected storage. (AC-14)
- `nutrientValue(product, key)` — `key` is a catalog id or an extra name;
  returns the per-100 value. For `"sodium"`: the printed sodium (mg) if
  present, else `saltToSodiumMg(per100.salt)`. Example: F1 → `72`. (AC-6, AC-14)

### `src/dish.js`
- `portionAmount(product, portions)` → `round2(product.portion_size * portions)`
  in the product's basis; `null` when `portion_size` is `null`. (AC-11)
- `computeDishTotals(items, selection)` — `items`:
  `[{product, amount}]` with `amount` in the product's basis; returns
  `{key: number | null}` for each key in `selection`, summing
  `scalePer100(nutrientValue(product, key), amount)`; any `null` contribution
  makes that total `null` (unknown), never 0. Extras sum only within equal
  units. Example: 30 g of F1 → `carbohydrate: 16.5`, `sodium: 21.6`. (AC-11)

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
- `exportAll()` → `{version: 1, products, dishes, log, selection, targets, settings: {baseUrl, model}, usage}` — **the API key is never exported**.
- `importAll(json)` — validates the shape, writes the keys, and **ignores any
  `apiKey` present** in the file. (AC-16)

## 8. Screens (`public/`, all texts in Spanish)

Footer on every screen: **"Gratis y sin anuncios"**.

1. **Escanear** — take or choose a photo; calls
   `extractLabel({fetch, settings, imageDataUrl})` with the settings from
   Ajustes; on success goes to Revisar; shows the Spanish `OcrClientError`
   messages on failure. Button "Introducir manualmente" → Revisar with an
   empty form (no photo needed). Calls: `extractLabel`.
2. **Revisar** — **mandatory before saving**. Form: name, basis (g/ml),
   portion size, the 13 catalog nutrients per 100 g/ml, the portion column as
   printed (read-only reference), extras (editable rows), optional density.
   Fields listed in `unreadable` (value `null`) are highlighted. "Guardar
   producto" → `createProduct` + `saveProduct`. Calls: `createProduct`,
   `saveProduct`, `NUTRIENTS`.
3. **Productos** — list/search/edit/delete saved products; per-product
   optional density. Calls: `listProducts`, `getProduct`, `saveProduct`,
   `deleteProduct`, `nutrientValue`.
4. **Plato** — pick saved products and amounts (in each product's basis, or
   "1 porción" via `portionAmount`); shows totals of the selected nutrients;
   can save the dish. Calls: `listProducts`, `portionAmount`,
   `computeDishTotals`.
5. **Hoy** — the day log for one date; browse by date; add dishes or product
   amounts; totals vs targets with progress. Calls: `dateKey`,
   `computeDayTotals`, `compareWithTargets`.
6. **Ajustes** — OCR settings (base URL, API key, model) with the CORS and
   provider-charges explanations of §6.6; nutrient selection; per-nutrient
   targets (min/max); JSON export/import; the local-only "Tu uso" counters
   (photos scanned, products saved, dishes computed, days logged). Calls:
   `sanitizeSelection`, `exportAll`, `importAll`.

## 9. Acceptance criteria

- **AC-1** `parseOcrResponse(F1_RAW)` deep-equals F1_NORMALIZED of §6.5,
  including the portion column exactly as printed (carbohydrate 16, not 16.5).
- **AC-2** `parseOcrResponse(F2_RAW)` deep-equals F2_NORMALIZED: the 200 ml
  glass column is the portion column, the %RI-only column is discarded, the
  "waarvan onverzadigde vetzuren" row maps to `unsaturates`, and vitamin C is
  the extra `{name: "Vitamine C", amount: 21, unit: "mg", ri_percent: 26}`.
- **AC-3** `parseOcrResponse(F3_RAW)` deep-equals F3_NORMALIZED: single
  per-100 column, `portion_size: null`, `portion: null`, vitamin E extra
  `{amount: 18, unit: "mg", ri_percent: 150}`.
- **AC-4** kJ and kcal are stored exactly as printed and never converted; a
  row with only one of them leaves the other `null` (e.g. `"47 kcal"` →
  `{energy_kj: null, energy_kcal: 47}`).
- **AC-5** `parseNumber("0,18")` → 0.18, `parseNumber("2.4")` → 2.4,
  `parseNumber("")`/`parseNumber(null)` → `null`; `null` is never turned
  into 0 anywhere.
- **AC-6** Sodium is in mg end to end: `saltToSodiumMg(0.18)` → 72;
  `nutrientValue(F1_PRODUCT, "sodium")` → 72; printed sodium `"0,072 g"` → 72
  and `"72 mg"` → 72; dish totals, day totals and targets for `sodium` are mg.
- **AC-7** `OCR_PROMPT` contains the words `rotated`, `blurry`, `finger`,
  `multilingual` and `unreadable` (case-insensitive); rotation/blur/finger are
  handled by the prompt and the Revisar screen, and every save goes through
  Revisar. The parser's own criteria (AC-1…AC-4, AC-10) cover JSON only.
- **AC-8** `extractLabel` with a fake `fetch` requests exactly
  `baseUrl` (trailing slashes stripped) + `/chat/completions`, method POST,
  headers `Authorization: Bearer <key>` and `Content-Type: application/json`,
  body `{model, messages, response_format: {type: "json_object"}, temperature: 0}`,
  and parses `choices[0].message.content`.
- **AC-9** `extractLabel` maps failures to `OcrClientError` codes `network`,
  `auth` (401), `rate_limit` (429), `http` (other status), `empty`,
  `invalid_json`, each with its Spanish message of §6.6; `parseOcrResponse`
  throws `OcrParseError` with codes `not_json`, `missing_columns`,
  `no_per100`, `bad_rows`.
- **AC-10** A column whose values are all percents is discarded as a column;
  rows with a g/mg/µg amount and a percent `ri` are kept as extras with
  `ri_percent`.
- **AC-11** `scalePer100(55, 30)` → 16.5; `portionAmount(F1_PRODUCT, 1)` → 30;
  `computeDishTotals([{product: F1, amount: 30}], ["carbohydrate", "sodium"])`
  → `{carbohydrate: 16.5, sodium: 21.6}`; a `null` nutrient in any item makes
  that total `null`, never 0.
- **AC-12** `convertAmount({value: 200, from: "ml", to: "g", density: null})`
  → `null`; with `density: 0.92` → 184; same-basis returns the value; no
  density is ever assumed by the code.
- **AC-13** `NUTRIENTS` contains exactly the 13 ids of §4 in order, with
  Spanish names and units (`sodium` in mg); `DEFAULT_SELECTION` and
  `sanitizeSelection` behave as specified.
- **AC-14** Product CRUD works over an injected storage backend;
  `createProduct(data, {id, createdAt})` is pure; extras of a saved product
  are selectable in the nutrient selection.
- **AC-15** `evaluateTarget`: `{min: 25}` with total 30 → `"ok"`, with 20 →
  `"under"`; `{max: 6}` with total 5 → `"ok"`, with 7 → `"over"`; total
  `null` → `"unknown"`; no tolerance.
- **AC-16** `exportAll()` output contains no `apiKey`; `importAll()` ignores
  an `apiKey` in the file; an export→import round-trip preserves products,
  dishes, log, selection, targets and usage.
- **AC-17** `dateKey(new Date(2025, 0, 5))` → `"2025-01-05"`;
  `computeDayTotals` sums the day's entries like `computeDishTotals`;
  `compareWithTargets` returns one status per selected key.
- **AC-18** The alias table matches the DE/FR/NL/IT names of §6.4.3 (e.g.
  `Fett`, `matières grasses`, `vetten`, `grassi`; `Kohlenhydrate`,
  `glucides`, `koolhydraten`, `carboidrati`; `Eiweiß`, `protéines`,
  `eiwitten`, `proteine`; `Salz`, `sel`, `zout`, `sale`).
- **AC-19** The app is served from the repository root and `public/` modules
  import `../src/`; there is no build step and no dependency in
  `package.json`; CI runs `npm test` on Node 24.
- **AC-20** All user-visible texts are in Spanish, including the footer
  "Gratis y sin anuncios" on every screen and every error message of §6.6;
  manual entry without a photo is possible from Escanear.

## 10. Open questions for the requester (with the defaults we build)

1. **App language** — default: Spanish (all UI texts).
2. **Platform** — default: mobile web, served statically from the repo root.
3. **OCR cost** — default: the user's own provider account pays per scan;
   Ajustes says so explicitly.
4. **Targets and day log** — default: included, optional to use (no target →
   no progress shown).
5. **Liquids in the planner** — default: amounts in the product's own basis;
   cross-basis only with an optional per-product, user-entered density.
6. **Sodium** — default: derived from salt ÷ 2.5 and shown in mg; printed
   sodium wins when present.
