// F3: Olive oil spray – rotated photo, only per 100 ml, vitamin E extra
export const raw = {
  productName: "Extra olijfolie van de eerste persing",
  basis: "ml",
  columns: [
    {
      label: "100 ml",
      amount: 100,
      unit: "ml",
      values: [
        { nutrient: "energie", amount: "3404 kJ / 828 kcal" },
        { nutrient: "vetten", amount: "92 g" },
        { nutrient: "waarvan verzadigde vetzuren", amount: "14 g" },
        { nutrient: "koolhydraten", amount: "0 g" },
        { nutrient: "waarvan suikers", amount: "0 g" },
        { nutrient: "vezels", amount: "0 g" },
        { nutrient: "eiwitten", amount: "0 g" },
        { nutrient: "zout", amount: "0 g" },
        { nutrient: "vitamine E", amount: "18 mg", ri: "150" }
      ]
    }
  ],
  notes: "200 ml. RI: 8400 kJ / 2000 kcal."
};

export const expected = {
  productName: "Extra olijfolie van de eerste persing",
  basis: "ml",
  portion: null,
  per100: {
    energy_kj: 3404,
    energy_kcal: 828,
    fat: 92,
    saturates: 14,
    carbohydrate: 0,
    sugars: 0,
    fibre: 0,
    protein: 0,
    salt: 0
  },
  portionValues: null,
  extras: [
    { name: "vitamina E", amount: 18, unit: "mg", riPercent: 150 }
  ],
  notes: "200 ml. RI: 8400 kJ / 2000 kcal."
};