// F2 — Dutch juice (1 L carton, glass = 200 ml)
// Two value columns: per 100 ml | per glas (200 ml), plus a second table of
// %RI per glass that must be ignored.

export const raw = {
  "product_name": "Sinasappelsap",
  "basis": "ml",
  "columns": [
    { "label": "per 100 ml", "amount": "100", "unit": "ml" },
    { "label": "per glas (200 ml)", "amount": "200", "unit": "ml" },
    { "label": "%RI per glas", "amount": null, "unit": null }
  ],
  "rows": [
    { "name": "Energie", "unit": null, "values": ["199 kJ / 47 kcal", "399 kJ / 94 kcal", "5,0%"], "ri": null },
    { "name": "Vetten", "unit": "g", "values": ["0", "0", "0%"], "ri": null },
    { "name": "waarvan verzadigde vetzuren", "unit": "g", "values": ["0", "0", "0%"], "ri": null },
    { "name": "waarvan onverzadigde vetzuren", "unit": "g", "values": ["0", "0", null], "ri": null },
    { "name": "Koolhydraten", "unit": "g", "values": ["11", "22", "8,0%"], "ri": null },
    { "name": "waarvan suikers", "unit": "g", "values": ["10", "20", "22%"], "ri": null },
    { "name": "Vezels", "unit": "g", "values": ["0,7", "1,4", null], "ri": null },
    { "name": "Eiwitten", "unit": "g", "values": ["0,4", "0,8", null], "ri": null },
    { "name": "Zout", "unit": "g", "values": ["0", "0", "0%"], "ri": null },
    { "name": "Vitamine C", "unit": "mg", "values": ["21", null, null], "ri": "26" }
  ],
  "unreadable": [],
  "notes": "1 L pak"
};

export const expected = {
  "name": "Sinasappelsap",
  "basis": "ml",
  "portion_size": 200,
  "derived_from_portion": false,
  "per100": {
    "energy_kj": 199,
    "energy_kcal": 47,
    "fat": 0,
    "saturates": 0,
    "unsaturates": 0,
    "monounsaturates": null,
    "polyunsaturates": null,
    "carbohydrate": 11,
    "sugars": 10,
    "fibre": 0.7,
    "protein": 0.4,
    "salt": 0,
    "sodium": null
  },
  "portion": {
    "energy_kj": 399,
    "energy_kcal": 94,
    "fat": 0,
    "saturates": 0,
    "unsaturates": 0,
    "monounsaturates": null,
    "polyunsaturates": null,
    "carbohydrate": 22,
    "sugars": 20,
    "fibre": 1.4,
    "protein": 0.8,
    "salt": 0,
    "sodium": null
  },
  "extras": [
    { "name": "Vitamine C", "amount": 21, "unit": "mg", "ri_percent": 26 }
  ],
  "unreadable": [],
  "notes": "1 L pak"
};