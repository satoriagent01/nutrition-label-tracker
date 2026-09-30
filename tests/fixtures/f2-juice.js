// F2: Dutch juice – per 100 ml and per glass (200 ml), vitamin C extra, %RI table
export const raw = {
  productName: "Versgeperst appel-sinaasappel- en mangosap",
  basis: "ml",
  columns: [
    {
      label: "100 ml",
      amount: 100,
      unit: "ml",
      values: [
        { nutrient: "energie", amount: "199 kJ / 47 kcal" },
        { nutrient: "vetten", amount: "0 g" },
        { nutrient: "waarvan verzadigde vetzuren", amount: "0 g" },
        { nutrient: "waarvan onverzadigde vetzuren", amount: "0 g" },
        { nutrient: "koolhydraten", amount: "11 g" },
        { nutrient: "waarvan suikers", amount: "10 g" },
        { nutrient: "vezels", amount: "0,7 g" },
        { nutrient: "eiwitten", amount: "0,4 g" },
        { nutrient: "zout", amount: "0 g" },
        { nutrient: "vitamine C", amount: "21 mg", ri: "26" }
      ]
    },
    {
      label: "glas (200 ml)",
      amount: 200,
      unit: "ml",
      values: [
        { nutrient: "energie", amount: "399 kJ / 94 kcal" },
        { nutrient: "vetten", amount: "0 g" },
        { nutrient: "waarvan verzadigde vetzuren", amount: "0 g" },
        { nutrient: "waarvan onverzadigde vetzuren", amount: "0 g" },
        { nutrient: "koolhydraten", amount: "22 g" },
        { nutrient: "waarvan suikers", amount: "20 g" },
        { nutrient: "vezels", amount: "1,4 g" },
        { nutrient: "eiwitten", amount: "0,8 g" },
        { nutrient: "zout", amount: "0 g" }
      ]
    },
    {
      label: "%RI per glas",
      amount: 200,
      unit: "ml",
      values: [
        { nutrient: "energie", amount: "5,0%" },
        { nutrient: "vetten", amount: "0%" },
        { nutrient: "waarvan verzadigde vetzuren", amount: "0%" },
        { nutrient: "koolhydraten", amount: "8,0%" },
        { nutrient: "waarvan suikers", amount: "22%" },
        { nutrient: "zout", amount: "0%" }
      ]
    }
  ],
  notes: "1 L, 5 porciones de 200 ml. RI: 8400 kJ / 2000 kcal."
};

export const expected = {
  productName: "Versgeperst appel-sinaasappel- en mangosap",
  basis: "ml",
  portion: { amount: 200, unit: "ml" },
  per100: {
    energy_kj: 199,
    energy_kcal: 47,
    fat: 0,
    saturates: 0,
    unsaturates: 0,
    carbohydrate: 11,
    sugars: 10,
    fibre: 0.7,
    protein: 0.4,
    salt: 0
  },
  portionValues: {
    energy_kj: 399,
    energy_kcal: 94,
    fat: 0,
    saturates: 0,
    unsaturates: 0,
    carbohydrate: 22,
    sugars: 20,
    fibre: 1.4,
    protein: 0.8,
    salt: 0
  },
  extras: [
    { name: "vitamina C", amount: 21, unit: "mg", riPercent: 26 }
  ],
  notes: "1 L, 5 porciones de 200 ml. RI: 8400 kJ / 2000 kcal."
};