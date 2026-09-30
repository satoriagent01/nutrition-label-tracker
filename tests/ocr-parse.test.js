import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseOcrResponse } from "../src/ocr-parse.js";
import { F1_RAW, F1_EXPECTED } from "./fixtures/f1-molto.js";
import { F2_RAW, F2_EXPECTED } from "./fixtures/f2-juice.js";
import { F3_RAW, F3_EXPECTED } from "./fixtures/f3-oil.js";

describe("parseOcrResponse (AC-1, AC-3, AC-4, AC-7, AC-9, AC-10, AC-12, AC-14, AC-15, AC-16, AC-17, AC-19)", () => {
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
      rows: [
        { cells: ["Energie", "1672 kJ", "399 kcal", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Fett", "0,1 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["davon gesättigte Fettsäuren", "0 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Kohlenhydrate", "84 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["davon Zucker", "80 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Ballaststoffe", "2,4 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Eiweiß", "10 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Salz", "1,8 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] }
      ],
      per100: true,
      portion: null,
      portionName: null
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
      rows: [
        { cells: ["Energie", "1672 kJ", "399 kcal", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Fett", "0,1 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["waarvan onverzadigde vetzuren", "0 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Koolhydraten", "84 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["waarvan suikers", "80 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Vezels", "2,4 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: "Eiwitten", "10 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Zout", "1,8 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] }
      ],
      per100: true,
      portion: null,
      portionName: null
    };
    const result = parseOcrResponse(raw);
    assert.strictEqual(result.per100.unsaturates, 0);
  });
});

describe("kJ/kcal split (AC-4)", () => {
  test("splits '1672 kJ / 399 kcal' into energy_kj and energy_kcal", () => {
    const raw = {
      rows: [
        { cells: ["Energie", "1672 kJ / 399 kcal", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Fett", "0,1 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Koolhydraten", "84 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Eiwitten", "10 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Zout", "1,8 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] }
      ],
      per100: true,
      portion: null,
      portionName: null
    };
    const result = parseOcrResponse(raw);
    assert.strictEqual(result.per100.energy_kj, 1672);
    assert.strictEqual(result.per100.energy_kcal, 399);
  });
});

describe("%RI-only column discarded (AC-7)", () => {
  test("discards %RI column, keeps only numeric columns", () => {
    const raw = {
      rows: [
        { cells: ["Energie", "1672 kJ", "399 kcal", "40%", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Fett", "0,1 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Koolhydraten", "84 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Eiwitten", "10 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Zout", "1,8 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] }
      ],
      per100: true,
      portion: null,
      portionName: null
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
  test("parses vitamin A as extras", () => {
    const raw = {
      rows: [
        { cells: ["Energie", "1672 kJ", "399 kcal", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Fett", "0,1 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Koolhydraten", "84 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Eiwitten", "10 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Zout", "1,8 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Vitamin A", "700 µg", "87%", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Vitamin D", "10 µg", "200%", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] }
      ],
      per100: true,
      portion: null,
      portionName: null
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
      rows: [
        { cells: ["Energie", "1672 kJ", "399 kcal", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Fett", "0,1 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Koolhydraten", "84 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Eiwitten", "10 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Zout", "1,8 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] }
      ],
      per100: true,
      portion: null,
      portionName: null
    };
    const result = parseOcrResponse(raw);
    assert.ok(result.per100);
    assert.strictEqual(result.portion, null);
  });
});

describe("no_per100 mode (AC-10)", () => {
  test("returns null per100 when no per100 column", () => {
    const raw = {
      rows: [
        { cells: ["Energie", "502 kJ", "120 kcal", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Fett", "3 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Koolhydraten", "24 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Eiwitten", "3 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] },
        { cells: ["Zout", "0,1 g", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—", "—"] }
      ],
      per100: false,
      portion: null,
      portionName: null
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
    assert.throws(() => parseOcrResponse({ rows: [{}], per100: true, portion: null, portionName: null }), TypeError);
  });
});