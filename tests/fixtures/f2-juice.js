// Fixture F2: Orange Juice - has a "glass" column (portion) and vitamin extras
// Raw OCR response as an array of strings (lines)
export const f2JuiceRaw = [
  "NUTRITION LABEL",
  "Per 100ml  Per 250ml glass",
  "Energy  kJ  180  450",
  "Energy  kcal  43  107",
  "Fat  0.2g  0.5g",
  "  of which saturates  0g  0g",
  "Carbohydrate  10g  25g",
  "  of which sugars  10g  25g",
  "Protein  0.1g  0.3g",
  "Vitamin C  50mg  125mg",
  "Vitamin D  1μg  2.5μg",
  "%RI Vitamin C  63%",
  "%RI Vitamin D  20%",
];

// Expected normalized output for F2
export const f2JuiceExpected = {
  per100: {
    energyKj: 180,
    energyKcal: 43,
    fat: 0.2,
    saturates: 0,
    carbohydrate: 10,
    sugars: 10,
    protein: 0.1,
    vitaminC: 50,
    vitaminD: 1,
  },
  per100PercentRI: {
    vitaminC: 63,
    vitaminD: 20,
  },
  portion: "250ml glass",
  portionGrams: 250,
};