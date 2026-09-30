import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseOcrResponse } from "../src/ocr-parse.js";
import { raw as F1_RAW, expected as F1_EXPECTED } from "./fixtures/f1-molto.js";
import { raw as F2_RAW, expected as F2_EXPECTED } from "./fixtures/f2-juice.js";
import { raw as F3_RAW, expected as F3_EXPECTED } from "./fixtures/f3-oil.js";

describe("parseOcrResponse (AC-1, AC-3, AC-4, AC-7, AC-10)", () => {
  test("F1: Schär Melto — full label with per100 and portion (AC-1)", () => {
    const result = parseOcrResponse(F1_RAW);
    assert.deepStrictEqual(result, F1_EXPECTED);
  });

  test("F2: Juice — glass column as portion, kJ/kcal split, no per100 (AC-3, AC-4, AC-7)", () => {
    const result = parseOcrResponse(F2_RAW);
    assert.deepStrictEqual(result, F2_EXPECTED);
  });

  test("F3: Olive oil — per100 only, no portion (AC-10)", () => {
    const result = parseOcrResponse(F3_RAW);
    assert.deepStrictEqual(result, F3_EXPECTED);
  });
});

describe("alias matching (AC-2, AC-18)", () => {
  test("recognizes 'fett' as fat (AC-2)", () => {
    const raw = {
      product_name: "Test",
      basis: "g",
      columns: [{ label: "per 100 g", amount: "100", unit: "g" }],
      rows: [
        { name: "Energie", unit: null, values: ["1672 kJ / 399 kcal"], ri: null },
        { name: "Fett", unit: "g", values: ["0,1"], ri: null },
        { name: "davon gesättigte Fettsäuren", unit: "g", values: ["0"], ri: null },
        { name: "Kohlenhydrate", unit: "g", values: ["84"], ri: null },
        { name: "davon Zucker", unit: "g", values: ["80"], ri: null },
        { name: "Ballaststoffe", unit: "g", values: ["2,4"], ri: null },
        { name: "Eiweiß", unit: "g", values: ["10"], ri: null },
        { name: "Salz", unit: "g", values: ["1,8"], ri: null }
      ],
      unreadable: [],
      notes: null
    };
    const result = parseOcrResponse(raw);
    assert.strictEqual(result.per100.fat, 0.1);
    assert.strictEqual(result.per100.saturates, 0);
    assert.strictEqual(result.per100.carbohydrate, 84);
    assert.strictEqual(result.per100.sugars, 80);
    assert.strictEqual(result.per100.fibre, 2.4);
    assert.strictEqual(result.per100.protein, 10);
    assert.strictEqual(result.per100.salt, 1.8);
  });

  test("recognizes 'waarvan onverzadigde vetzuren' as unsaturates (AC-18)", () => {
    const raw = {
      product_name: "Test",
      basis: "g",
      columns: [{ label: "per 100 g", amount: "100", unit: "g" }],
      rows: [
        { name: "Energie", unit: null, values: ["1672 kJ / 399 kcal"], ri: null },
        { name: "Fett", unit: "g", values: ["0,1"], ri: null },
        { name: "waarvan onverzadigde vetzuren", unit: "g", values: ["0"], ri: null },
        { name: "Koolhydraten", unit: "g", values: ["84"], ri: null },
        { name: "waarvan suikers", unit: "g", values: ["80"], ri: null },
        { name: "Vezels", unit: "g", values: ["2,4"], ri: null },
        { name: "Eiwitten", unit: "g", values: ["10"], ri: null },
        { name: "Zout", unit: "g", values: ["1,8"], ri: null }
      ],
      unreadable: [],
      notes: null
    };
    const result = parseOcrResponse(raw);
    assert.strictEqual(result.per100.unsaturates, 0);
  });
});

describe("kJ/kcal split (AC-4)", () => {
  test("splits '1672 kJ / 399 kcal' into energy_kj and energy_kcal", () => {
    const raw = {
      product_name: "Test",
      basis: "g",
      columns: [{ label: "per 100 g", amount: "100", unit: "g" }],
      rows: [
        { name: "Energie", unit: null, values: ["1672 kJ / 399 kcal"], ri: null },
        { name: "Fett", unit: "g", values: ["0,1"], ri: null },
        { name: "Koolhydraten", unit: "g", values: ["84"], ri: null },
        { name: "Eiwitten", unit: "g", values: ["10"], ri: null },
        { name: "Zout", unit: "g", values: ["1,8"], ri: null }
      ],
      unreadable: [],
      notes: null
    };
    const result = parseOcrResponse(raw);
    assert.strictEqual(result.per100.energy_kj, 1672);
    assert.strictEqual(result.per100.energy_kcal, 399);
  });
});

describe("%RI-only column discarded (AC-7)", () => {
  test("discards %RI column, keeps only numeric columns", () => {
    const raw = {
      product_name: "Test",
      basis: "g",
      columns: [
        { label: "per 100 g", amount: "100", unit: "g" },
        { label: "% RI", amount: null, unit: "%" }
      ],
      rows: [
        { name: "Energie", unit: null, values: ["1672 kJ", "399 kcal", "40%"], ri: null },
        { name: "Fett", unit: "g", values: ["0,1", "—"], ri: null },
        { name: "Koolhydraten", unit: "g", values: ["84", "—"], ri: null },
        { name: "Eiwitten", unit: "g", values: ["10", "—"], ri: null },
        { name: "Zout", unit: "g", values: ["1,8", "—"], ri: null }
      ],
      unreadable: [],
      notes: null
    };
    const result = parseOcrResponse(raw);
    assert.strictEqual(result.per100.energy_kj, 1672);
    assert.strictEqual(result.per100.energy_kcal, 399);
    assert.strictEqual(result.per100.fat, 0.1);
    assert.strictEqual(result.per100.carbohydrate, 84);
    assert.strictEqual(result.per100.protein, 10);
    assert.strictEqual(result.per100.salt, 1.8);
  });
});

describe("vitamin extras (AC-14, AC-15, AC-16, AC-17)", () => {
  test("parses vitamin A and D as extras", () => {
    const raw = {
      product_name: "Test",
      basis: "g",
      columns: [{ label: "per 100 g", amount: "100", unit: "g" }],
      rows: [
        { name: "Energie", unit: null, values: ["1672 kJ / 399 kcal"], ri: null },
        { name: "Fett", unit: "g", values: ["0,1"], ri: null },
        { name: "Koolhydraten", unit: "g", values: ["84"], ri: null },
        { name: "Eiwitten", unit: "g", values: ["10"], ri: null },
        { name: "Zout", unit: "g", values: ["1,8"], ri: null },
        { name: "Vitamin A", unit: "µg", values: ["700"], ri: ["87%"] },
        { name: "Vitamin D", unit: "µg", values: ["10"], ri: ["200%"] }
      ],
      unreadable: [],
      notes: null
    };
    const result = parseOcrResponse(raw);
    assert.ok(result.per100.extras);
    assert.strictEqual(result.per100.extras["vitamin_a"], 700);
    assert.strictEqual(result.per100.extras["vitamin_d"], 10);
  });
});

describe("portion-only derivation (AC-9)", () => {
  test("derives portion from per100 when no portion column", () => {
    const raw = {
      product_name: "Test",
      basis: "g",
      columns: [{ label: "per 100 g", amount: "100", unit: "g" }],
      rows: [
        { name: "Energie", unit: null, values: ["1672 kJ / 399 kcal"], ri: null },
        { name: "Fett", unit: "g", values: ["0,1"], ri: null },
        { name: "Koolhydraten", unit: "g", values: ["84"], ri: null },
        { name: "Eiwitten", unit: "g", values: ["10"], ri: null },
        { name: "Zout", unit: "g", values: ["1,8"], ri: null }
      ],
      unreadable: [],
      notes: null
    };
    const result = parseOcrResponse(raw);
    assert.ok(result.per100);
    assert.strictEqual(result.portion, null);
  });
});

describe("no_per100 mode (AC-10)", () => {
  test("returns null per100 when no per100 column", () => {
    const raw = {
      product_name: "Test",
      basis: "g",
      columns: [{ label: "per serving", amount: "250", unit: "ml" }],
      rows: [
        { name: "Energie", unit: null, values: ["502 kJ / 120 kcal"], ri: null },
        { name: "Fett", unit: "g", values: ["3"], ri: null },
        { name: "Koolhydraten", unit: "g", values: ["24"], ri: null },
        { name: "Eiwitten", unit: "g", values: ["3"], ri: null },
        { name: "Zout", unit: "g", values: ["0,1"], ri: null }
      ],
      unreadable: [],
      notes: null
    };
    const result = parseOcrResponse(raw);
    assert.strictEqual(result.per100, null);
    assert.ok(result.portion);
  });
});

describe("typed errors on malformed input (AC-19)", () => {
  test("throws TypeError for null input", () => {
    assert.throws(() => parseOcrResponse(null), TypeError);
  });

  test("throws TypeError for empty rows", () => {
    assert.throws(() => parseOcrResponse({ rows: [] }), TypeError);
  });

  test("throws TypeError for rows without cells", () => {
    assert.throws(() => parseOcrResponse({ rows: [{}], columns: [] }), TypeError);
  });
});