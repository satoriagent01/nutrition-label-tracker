// Fixture F1: Molto Calcio - standard nutrition label
// Raw OCR response as an array of strings (lines)
export const f1MoltoRaw = [
  "NUTRITION LABEL",
  "Per 100ml",
  "Energy  kJ  170",
  "Energy  kcal  40",
  "Fat  0g",
  "  of which saturates  0g",
  "Carbohydrate  9g",
  "  of which sugars  9g",
  "Fibre  0g",
  "Protein  0g",
  "Salt  0.01g",
  "Sodium  4mg",
  "Calcium  90mg",
  "%RI Calcium  11%",
];

// Expected normalized output for F1
export const f1MoltoExpected = {
  per100: {
    energyKj: 170,
    energyKcal: 40,
    fat: 0,
    saturates: 0,
    carbohydrate: 9,
    sugars: 9,
    fibre: 0,
    protein: 0,
    salt: 0.01,
    sodium: 4,
    calcium: 90,
  },
  per100PercentRI: {
    calcium: 11,
  },
  portion: undefined,
  portionGrams: undefined,
};