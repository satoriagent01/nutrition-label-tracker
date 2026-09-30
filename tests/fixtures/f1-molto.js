// F1 — Dr. Schär Melto (German label, EU comma decimals)
// Package 90 g, portion 30 g. Two columns: per 100 g | per 30 g.

export const raw = {
  "product_name": "Dr. Schär Melto",
  "basis": "g",
  "columns": [
    { "label": "per 100 g", "amount": "100", "unit": "g" },
    { "label": "per 30 g", "amount": "30", "unit": "g" }
  ],
  "rows": [
    { "name": "Energie", "unit": null, "values": ["2292 kJ / 549 kcal", "688 kJ / 165 kcal"], "ri": null },
    { "name": "Fett", "unit": "g", "values": ["33", "10"], "ri": null },
    { "name": "davon gesättigte Fettsäuren", "unit": "g", "values": ["13", "3,9"], "ri": null },
    { "name": "Kohlenhydrate", "unit": "g", "values": ["55", "16"], "ri": null },
    { "name": "davon Zucker", "unit": "g", "values": ["45", "14"], "ri": null },
    { "name": "Ballaststoffe", "unit": "g", "values": ["2,4", "0,7"], "ri": null },
    { "name": "Eiweiß", "unit": "g", "values": ["6,8", "2,0"], "ri": null },
    { "name": "Salz", "unit": "g", "values": ["0,18", "0,05"], "ri": null }
  ],
  "unreadable": [],
  "notes": null
};

export const expected = {
  "name": "Dr. Schär Melto",
  "basis": "g",
  "portion_size": 30,
  "derived_from_portion": false,
  "per100": {
    "energy_kj": 2292,
    "energy_kcal": 549,
    "fat": 33,
    "saturates": 13,
    "unsaturates": null,
    "monounsaturates": null,
    "polyunsaturates": null,
    "carbohydrate": 55,
    "sugars": 45,
    "fibre": 2.4,
    "protein": 6.8,
    "salt": 0.18,
    "sodium": null
  },
  "portion": {
    "energy_kj": 688,
    "energy_kcal": 165,
    "fat": 10,
    "saturates": 3.9,
    "unsaturates": null,
    "monounsaturates": null,
    "polyunsaturates": null,
    "carbohydrate": 16,
    "sugars": 14,
    "fibre": 0.7,
    "protein": 2,
    "salt": 0.05,
    "sodium": null
  },
  "extras": [],
  "unreadable": [],
  "notes": null
};