import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseOcrResponse } from "../src/ocr-parse.js";
import { f1MoltoRaw, f1MoltoExpected } from "./fixtures/f1-molto.js";
import { f2JuiceRaw, f2JuiceExpected } from "./fixtures/f2-juice.js";
import { f3OilRaw, f3OilExpected } from "./fixtures/f3-oil.js";

// Helper: deep equality with 1e-9 tolerance for numbers
function deepEqual(actual, expected, tolerance = 1e-9) {
  if (actual === expected) return true;
  if (actual === null || expected === null) return actual === expected;
  if (typeof actual !== typeof expected) return false;
  if (typeof actual !== "object") return false;
  if (Array.isArray(actual) !== Array.isArray(expected)) return false;
  if (Array.isArray(actual)) {
    if (actual.length !== expected.length) return false;
    return actual.every((v, i) => deepEqual(v, expected[i], tolerance));
  }
  const keysA = Object.keys(actual);
  const keysE = Object.keys(expected);
  if (keysA.length !== keysE.length) return false;
  for (const key of keysA) {
    if (!(key in expected)) return false;
    if (!deepEqual(actual[key], expected[key], tolerance)) return false;
  }
  return true;
}

describe("parseOcrResponse - F1 Molto Calcio (AC-6, AC-7, AC-8)", () => {
  test("returns normalized object matching expected output (AC-6)", () => {
    const result = parseOcrResponse(f1MoltoRaw);
    assert.ok(deepEqual(result, f1MoltoExpected));
  });

  test("sodium is derived from salt (AC-7)", () => {
    const result = parseOcrResponse(f1MoltoRaw);
    // salt is 0.01g -> sodium = 0.01 * 1000 / 2.5 = 4mg
    assert.strictEqual(result.per100.sodium, 4);
  });

  test("unsaturates = fat - saturates (AC-8)", () => {
    const result = parseOcrResponse(f1MoltoRaw);
    // fat=0.5, saturates=0.3 -> unsaturates=0.2
    assert.strictEqual(result.per100.unsaturates, 0.2);
  });
});

describe("parseOcrResponse - F2 Orange Juice with glass column (AC-9, AC-10)", () => {
  test("glass column is kept as portion (AC-9)", () => {
    const result = parseOcrResponse(f2JuiceRaw);
    assert.strictEqual(result.portion, "250ml");
  });

  test("per100 values are scaled from portion (AC-10)", () => {
    const result = parseOcrResponse(f2JuiceRaw);
    // If portion is 250ml and energyKcal is 110, per100 = 110 * 100 / 250 = 44
    assert.strictEqual(result.per100.energyKcal, 44);
  });
});

describe("parseOcrResponse - F3 Olive Oil kJ/kcal split (AC-11, AC-12)", () => {
  test("kJ and kcal are both captured (AC-11)", () => {
    const result = parseOcrResponse(f3OilRaw);
    assert.strictEqual(result.per100.energyKj, 3370);
    assert.strictEqual(result.per100.energyKcal, 800);
  });

  test("kJ/kcal values are never converted to each other (AC-12)", () => {
    const result = parseOcrResponse(f3OilRaw);
    // They should remain as read, not converted
    assert.strictEqual(result.per100.energyKj, 3370);
    assert.strictEqual(result.per100.energyKcal, 800);
  });
});

describe("parseOcrResponse - alias matching (AC-13)", () => {
  test("recognizes 'sugars' as alias for 'sugar' (AC-13)", () => {
    const lines = [
      "Per 100g",
      "Energy  100kcal",
      "Sugar  5g",
    ];
    const result = parseOcrResponse(lines);
    assert.strictEqual(result.per100.sugars, 5);
  });

  test("recognizes 'fat' as alias for 'total fat' (AC-13)", () => {
    const lines = [
      "Per 100g",
      "Energy  100kcal",
      "Total Fat  10g",
    ];
    const result = parseOcrResponse(lines);
    assert.strictEqual(result.per100.fat, 10);
  });
});

describe("parseOcrResponse - %RI-only column discarded (AC-14)", () => {
  test("discards rows that are %RI only (AC-14)", () => {
    const lines = [
      "Per 100g",
      "Energy  100kcal  5%",
      "Fat  10g  14%",
    ];
    const result = parseOcrResponse(lines);
    // %RI values should not appear in per100PercentRI
    assert.deepStrictEqual(result.per100PercentRI, {});
  });
});

describe("parseOcrResponse - vitamin extras (AC-15)", () => {
  test("captures extra vitamins like E and K (AC-15)", () => {
    const lines = [
      "Per 100g",
      "Energy  100kcal",
      "Vitamin E  14mg",
      "Vitamin K  60μg",
    ];
    const result = parseOcrResponse(lines);
    assert.strictEqual(result.per100.vitaminE, 14);
    assert.strictEqual(result.per100.vitaminK, 60);
  });
});

describe("parseOcrResponse - portion-only derivation (AC-16)", () => {
  test("derives per100 from portion-only data (AC-16)", () => {
    const lines = [
      "Per serving (250g)",
      "Energy  200kcal",
      "Fat  20g",
    ];
    const result = parseOcrResponse(lines);
    // per100 = value * 100 / 250
    assert.strictEqual(result.per100.energyKcal, 80);
    assert.strictEqual(result.per100.fat, 8);
  });

  test("no_per100 when portion cannot be derived (AC-16)", () => {
    const lines = [
      "Per serving",
      "Energy  200kcal",
    ];
    const result = parseOcrResponse(lines);
    assert.strictEqual(result.per100, undefined);
  });
});

describe("parseOcrResponse - typed errors (AC-17, AC-18, AC-19, AC-20)", () => {
  test("throws TypeError for non-array input (AC-17)", () => {
    assert.throws(() => parseOcrResponse("not an array"), {
      name: "TypeError",
    });
  });

  test("throws TypeError for empty array (AC-18)", () => {
    assert.throws(() => parseOcrResponse([]), {
      name: "TypeError",
    });
  });

  test("throws Error for malformed line (AC-19)", () => {
    const lines = [
      "Per 100g",
      "Energy  abc",
    ];
    assert.throws(() => parseOcrResponse(lines), {
      name: "Error",
    });
  });

  test("throws Error for missing per100 header (AC-20)", () => {
    const lines = [
      "No header here",
      "Energy  100kcal",
    ];
    assert.throws(() => parseOcrResponse(lines), {
      name: "Error",
    });
  });
});