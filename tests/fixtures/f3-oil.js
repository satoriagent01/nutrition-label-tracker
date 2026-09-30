// Fixture F3: Olive Oil - kJ/kcal on separate lines, no per100 %RI
// Raw OCR response as an array of strings (lines)
export const f3OilRaw = [
  "NUTRITION LABEL",
  "Per 100ml",
  "Energy  3370  800",
  "Fat  100g",
  "  of which saturates  13.8g",
  "Carbohydrate  0g",
  "  of which sugars  0g",
  "Protein  0g",
  "Salt  0g",
  "Vitamin E  14mg",
  "Vitamin K  60μg",
];

// Expected normalized output for F3
export const f3OilExpected = {
  per100: {
    energyKj: 3370,
    energyKcal: 800,
    fat: 100,
    saturates: 13.8,
    carbohydrate: 0,
    sugars: 0,
    protein: 0,
    salt: 0,
    vitaminE: 14,
    vitaminK: 60,
  },
  per100PercentRI: {},
  portion: undefined,
  portionGrams: undefined,
};