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

### Fixture F2 — Fresh-squeezed juice (2.jpg)

Apple/orange/mango juice, Dutch label. Package 1 L, 5 portions of 200 ml.
Columns: per 100 ml, per glass (200 ml).

| Nutrient | Per 100 ml | Per glass (200 ml) |
|---|---|---|
| Energy | 199 kJ / 47 kcal | 399 kJ / 94 kcal |
| Fat | 0 g | 0 g |
| of which saturates | 0 g | 0 g |
| of which unsaturates | 0 g | 0 g |
| Carbohydrate | 11 g | 22 g |
| of which sugars | 10 g | 20 g |
| Fibre | 0,7 g | 1,4 g |
| Protein | 0,4 g | 0,8 g |
| Salt | 0 g | 0 g |

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
4. **Sodium:** `sodium_g = salt_g / 2.5` (EU factor), derived when the label
   prints salt. Sodium is also enterable directly if the label prints it.
   Sodium is displayed in **mg** (`sodium_mg = sodium_g * 1000`). F1: salt
   0.18 g → sodium 0.072 g = 72 mg per 100 g.
5. **Calculation source is the per-100 g / per-100 ml column.** The portion
   column is kept as printed (plus the portion size), but never used as a
   formula check — it is rounded on the label (F1: 55 g carbs → printed 16 g
   per 30 g, not 16.5; 2292 kJ → printed 688 kJ). When the user picks
   "1 porción", the app computes `portion_size × per-100 value / 100`
   (16.5 g for F1 carbs — the difference from the printed 16 g is expected).
6. **ml is never equated with g.** Each product has a basis: `"g"` or `"ml"`.
   Dish amounts are entered in the product's basis. A product may carry an
   optional user-entered `density_g_per_ml` (number > 0) that lets the UI
   convert an amount for that product only. No hardcoded densities anywhere.
7. **Scaling:** `nutrient_amount = per100_value × amount / 100`. If
   `per100_value` is `null`, the result for that nutrient is `null` (unknown),
   never 0. Dish totals sum known values; a nutrient with any `null`
   contribution is reported as `null` (partially unknown) with the list of
   products missing it.

## 6. Nutrient catalog

Fixed catalog of trackable nutrients. `id`, Spanish display name, display unit:

| id | Nombre (ES) | Unit |
|---|---|---|
| `energy_kj` | Energía (kJ) | kJ |
| `energy_kcal` | Energía (kcal) | kcal |
| `fat` | Grasas | g |
| `saturates` | Grasas saturadas | g |
| `monounsaturates` | Grasas monoinsaturadas | g |
| `polyunsaturates` | Grasas poliinsaturadas | g |
| `carbohydrate` | Carbohidratos | g |
| `sugars` | Azúcares | g |
| `fibre` | Fibra | g |
| `protein` | Proteínas | g |
| `salt` | Sal | g |
| `sodium` | Sodio | mg (stored in g, shown in mg) |

**Extras:** anything else on a label (vitamin C, vitamin E, …) is stored per
product as `{ name, amount, unit, ri_percent }` (per the product's basis, i.e.
per 100 g or per 100 ml; `ri_percent` may be `null`). An extra becomes
trackable once it exists in a saved product; the tracking UI offers it under
its `name` with its `unit`. Examples: F2 `{ name: "Vitamina C", amount: 21,
unit: "mg", ri_percent: 26 }`; F3 `{ name: "Vitamina E", amount: 18, unit:
"mg", ri_percent: 150 }`.

## 7. OCR contract (the only AI part)

One path, no proxy: the browser calls an OpenAI-compatible
`POST {url}/chat/completions` endpoint with the user's URL, API key and model.
Settings live in `localStorage` only, are never committed and never sent
anywhere but the configured endpoint. The UI explains that the endpoint must
allow browser (CORS) requests and that the user's provider may charge per call.

- **Request:** the photo as a base64 data URL in an `image_url` content part,
  plus the prompt from `src/ocr-prompt.js`. `response_format` requests JSON.
- **Prompt** (built in `src/`, English instructions to the model): read the
  nutrition table even if the photo is rotated, blurry, partly covered or
  multilingual; return strict JSON only; never invent values — mark unreadable
  cells in `unreadable`; ignore %RI-only tables; keep the printed decimal
  separator.
- **Response JSON schema** (what the model must return, what the parser
  accepts):

```json
{
  "product_name": "string | null",
  "basis": "g | ml",
  "columns": [
    {
      "label": "string (as printed, e.g. \"100 g\", \"30 g = 1 Melto\")",
      "amount": 100,
      "unit": "g | ml",
      "values": [
        { "nutrient": "energy_kj | energy_kcal | fat | ... | free text",
          "value": 33,
          "unit": "g | mg | µg | kJ | kcal",
          "ri_percent": null }
      ]
    }
  ],
  "unreadable": ["string — cells or fields the model could not read"],
  "notes": "string | null"
}
```

- **Normalization (pure, in `src/ocr-parse.js`):** pick the per-100 column
  (amount 100, unit = basis) as the calculation source; keep the portion column
  as printed (label, amount, unit); drop %RI-only tables; map nutrient names in
  any of the label languages to catalog ids where possible, otherwise keep them
  as extras candidates; parse comma/dot decimals; validate units
  (`g, mg, µg, kJ, kcal`); typed errors on malformed input.

## 8. Modules (`src/`), signatures and examples

All pure unless noted. Amounts are numbers; missing/unreadable is `null`.

### `src/nutrients.js` — catalog and units

- `NUTRIENTS` — array of `{ id, nameEs, unit }` exactly as in §6.
- `getNutrient(id)` → the entry or `null`.
- `parseNumber(text)` → `number | null`; accepts `"2,4"`, `"3.9"`, `"1 292"`;
  `null` on empty/non-numeric. Example: `parseNumber("0,18")` → `0.18`.
- `saltToSodiumMg(saltG)` → `number | null`; `saltToSodiumMg(0.18)` → `72`;
  `null` in → `null` out.
- `scalePer100(per100Value, amount)` → `number | null`;
  `scalePer100(55, 30)` → `16.5`; `null` in → `null` out.
- `convertAmount(amount, fromUnit, toUnit, densityGPerMl?)` → `number | null`;
  converts only g↔g, ml↔ml, and g↔ml when `densityGPerMl > 0` is given;
  otherwise `null`. Never assumes 1 ml = 1 g.

### `src/ocr-prompt.js` — the OCR prompt

- `OCR_PROMPT` — the instruction string (§7).
- `buildOcrMessages(imageDataUrl)` → the `messages` array for the chat
  completions request (system prompt + user message with the image data URL).

### `src/ocr-parse.js` — normalize the model's JSON (pure)

- `parseOcrResponse(json)` → normalized label or throws `OcrParseError`
  (`error.code`: `"invalid_json" | "invalid_schema" | "no_per100_column"`).
  Output:

```js
{
  productName: "Melto",            // string | null
  basis: "g",                      // "g" | "ml"
  per100: { energy_kj: 2292, energy_kcal: 549, fat: 33, saturates: 13,
            carbohydrate: 55, sugars: 45, fibre: 2.4, protein: 6.8,
            salt: 0.18 },          // catalog ids; absent ids are simply absent
  extras: [],                      // [{ name, amount, unit, ri_percent }]
  portion: { label: "30 g = 1 Melto", amount: 30, unit: "g",
             values: { energy_kj: 688, energy_kcal: 165, fat: 10, ... } } | null,
  unreadable: [],                  // strings
  notes: null
}
```

  F2 yields `basis: "ml"`, `per100: { energy_kj: 199, energy_kcal: 47, fat: 0,
  saturates: 0, monounsaturates: 0, carbohydrate: 11, sugars: 10, fibre: 0.7,
  protein: 0.4, salt: 0 }`, `extras: [{ name: "Vitamina C", amount: 21,
  unit: "mg", ri_percent: 26 }]`, portion `{ amount: 200, unit: "ml" }`, and no
  trace of the %RI table. F3 yields only `per100` (portion `null`) with
  `extras: [{ name: "Vitamina E", amount: 18, unit: "mg", ri_percent: 150 }]`.
- `OcrParseError` — `Error` subclass with a `code` field.

### `src/ocr-client.js` — the network call (fetch injected)

- `async extractLabel({ fetch, settings, imageDataUrl })` → the normalized
  result of `parseOcrResponse`. `settings = { url, apiKey, model }`. Builds the
  request with `buildOcrMessages`, POSTs JSON to `{url}/chat/completions`,
  reads the first choice's message content, parses and normalizes it.
- Throws `OcrClientError` (`error.code`, Spanish `error.message`):
  - `"network"` — fetch rejected / CORS: "No se pudo conectar con el servicio
    de OCR. Revisá la URL y que el servicio permita peticiones desde el
    navegador (CORS)."
  - `"auth"` (401/403): "La clave de API fue rechazada. Revisala en Ajustes."
  - `"rate_limit"` (429): "El servicio de OCR está ocupado. Probá de nuevo en
    unos segundos."
  - `"bad_response"` — non-JSON or schema mismatch: "El servicio de OCR
    devolvió una respuesta inválida."
- Tests use a fake `fetch`; they never hit the network.

### `src/products.js` — saved products (pure; storage injected)

Product shape:

```js
{ id: "p_...", name: "Melto", basis: "g",
  per100: { /* catalog ids → number|null */ },
  extras: [ { name, amount, unit, ri_percent } ],
  portion: { label, amount, unit, values } | null,
  densityGPerMl: null,             // optional, user-entered, > 0
  createdAt: "ISO string" }
```

- `createProduct(data)` → product (validates basis, numbers, density > 0;
  derives nothing — sodium is computed at display time by `nutrients.js`).
- `updateProduct(product, patch)` → new product.
- `listProducts(store)` / `getProduct(store, id)` / `saveProduct(store,
  product)` / `deleteProduct(store, id)` — `store` is the storage facade (§
  `storage.js`); these only (de)serialize and delegate.
- `nutrientValue(product, nutrientId)` → per-100 value (`number | null`);
  for `"sodium"` returns the derived `salt / 2.5` g when no printed sodium
  exists; for extras, matches by name.

### `src/dish.js` — the meal planner math (pure)

Dish shape: `{ id, name, items: [{ productId, amount }] }` — `amount` in the
product's basis (g or ml).

- `computeDishTotals(items, productsById, nutrientIds)` →
  `{ [nutrientId]: { value: number | null, unknownIn: [productId] } }`.
  Rule 5.7: `null` contributions make the total `null` and list the products.
  Example: 30 g of F1 → `energy_kcal: { value: 164.7, unknownIn: [] }`,
  `carbohydrate: { value: 16.5, unknownIn: [] }`; 200 ml of F2 →
  `energy_kcal: 94`, `sugars: 20`.
- `portionAmount(product)` → the amount for "1 porción" (`portion.amount`) or
  `null` when the product has no portion.

### `src/tracking.js` — the custom nutrient mix and targets (pure)

- `DEFAULT_SELECTION` — `["energy_kcal", "sodium", "saturates"]` (a starting
  mix; the user changes it freely).
- `sanitizeSelection(ids)` → deduped ids that exist in the catalog or in saved
  products' extras.
- Target shape: `{ nutrientId, kind: "min" | "max", amount }` (per day, in the
  nutrient's display unit).
- `evaluateTarget(total, target)` → `{ status: "ok" | "over" | "under" |
  "unknown", percent: number | null }`. `total null` → `"unknown"`. For
  `"max"`: `over` when `total > amount`; `percent = total/amount*100`. For
  `"min"`: `under` when `total < amount`.

### `src/log.js` — the day log (pure)

One day at a time, browsable by date. Entry: `{ date: "YYYY-MM-DD", dishId |
items, note? }`.

- `dateKey(date)` → `"YYYY-MM-DD"`.
- `computeDayTotals(entries, dishesById, productsById, nutrientIds)` → same
  shape as `computeDishTotals`, summing across entries (rule 5.7 applies across
  the whole day).
- `compareWithTargets(totals, targets)` → `{ [nutrientId]: evaluateTarget(...) }`.

### `src/storage.js` — persistence facade (storage injected)

- `createStorage(backend)` — `backend` is anything with `getItem/setItem`
  (in the app: `localStorage`; in tests: an in-memory object). Keys are
  namespaced (`nlt.products`, `nlt.dishes`, `nlt.log`, `nlt.selection`,
  `nlt.targets`, `nlt.settings`, `nlt.usage`).
- `load(store, key, fallback)` / `save(store, key, value)` — JSON
  (de)serialization; corrupt JSON yields the fallback, never a throw.
- `exportAll(store)` → one JSON string with every key (for backup).
- `importAll(store, json)` → replaces all keys; throws on invalid JSON.
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
   fields are highlighted and editable; every value can be corrected; the basis
   (g/ml) and optional density can be set. "Guardar producto" persists via
   `products.js`. Nothing is saved without this screen.
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
6. **Ajustes** — OCR endpoint (URL, API key, model) with the CORS and
   possible-provider-charges explanation; nutrient selection (the custom mix,
   including extras from saved products); optional per-nutrient daily target
   (min/max); JSON export/import; "Tu uso" — local-only counters (products
   scanned, dishes planned, days logged), no analytics, nothing leaves the
   device.

## 10. Acceptance criteria

- **AC-1 (R-1):** Escanear offers camera capture via file input and accepts an
  image; the image reaches the OCR client as a base64 data URL.
- **AC-2 (R-2):** `extractLabel` POSTs to `{url}/chat/completions` with the
  configured model, key and the image, and returns the normalized label (fake
  fetch in tests).
- **AC-3 (R-3):** every module except `ocr-client.js` is pure and contains no
  AI/network call; tests exercise them without network.
- **AC-4 (R-4):** the user can select any mix of catalog nutrients (and extras
  from saved products); the selection persists; nothing in the UI presumes a
  weight-loss or heart goal.
- **AC-5 (R-5):** entering amounts per product in a dish yields totals per
  selected nutrient per rule 5.7 (30 g F1 → 164.7 kcal, 16.5 g carbohydrate;
  200 ml F2 → 94 kcal, 20 g sugars).
- **AC-6 (R-6):** no ads, no trackers, no accounts; the footer "Gratis y sin
  anuncios" is present; "Tu uso" counters stay local.
- **AC-7 (R-7):** the parser normalizes F1 (multilingual, two columns), F2
  (per 100 ml + glass, %RI table dropped, vitamin C extra) and F3 (rotated,
  per-100 ml only, vitamin E extra) to the exact values of §4.
- **AC-8:** kJ and kcal are stored as printed and never converted; a missing
  one stays `null` (rule 5.1).
- **AC-9:** `parseNumber("2,4")` → `2.4`, `parseNumber("3.9")` → `3.9`;
  `null` is never coerced to `0` anywhere (rules 5.2, 5.3).
- **AC-10:** sodium derives from salt with factor 2.5 and displays in mg
  (F1: 72 mg per 100 g); printed sodium is used when present (rule 5.4).
- **AC-11:** calculations use only the per-100 column; the portion column is
  kept as printed; "1 porción" computes portion size × per-100 (F1 carbs →
  16.5 g, not the printed 16 g) (rule 5.5).
- **AC-12:** ml and g are never equated; dish amounts use the product's basis;
  g↔ml conversion happens only with a user-entered density for that product
  (rule 5.6).
- **AC-13:** malformed OCR JSON raises typed errors (`invalid_json`,
  `invalid_schema`, `no_per100_column`); network, 401/403 and 429 map to the
  Spanish messages of §8.
- **AC-14:** nothing is saved without the Revisar screen; unreadable fields
  are highlighted and editable; manual entry without a photo works.
- **AC-15:** optional daily targets (min/max) evaluate against day totals with
  statuses ok/over/under/unknown; days are browsable by date.
- **AC-16:** JSON export/import round-trips all data; corrupt stored JSON
  falls back without throwing.
- **AC-17:** settings (URL, key, model) live only in localStorage; Ajustes
  explains CORS and that the provider may charge.

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
   show it in mg, since the requester asked to track sodium.
