// F3 — Olive oil spray (Dutch, 200 ml, rotated photo)
// Only one column: per 100 ml.

export const raw = {
  "product_name": "Olijfolie spray",
  "basis": "ml",
  "columns": [
    { "label": "per 100 ml", "amount": "100", "unit": "ml" }
  ],
  "rows": [
    { "name": "Energie", "unit": null, "values": ["3404 kJ / 828 kcal"], "ri": null },
    { "name": "Vetten", "unit": "g", "values": ["92"], "ri": null },
    { "name": "waarvan verzadigd", "unit": "g", "values": ["14"], "ri": null },
    { "name": "Koolhydraten", "unit": "g", "values": ["0"], "ri": null },
    { "name": "waarvan suikers", "unit": "g", "values": ["0"], "ri": null },
    { "name": "Vezels", "unit": "g", "values": ["0"], "ri": null },
    { "name": "Eiwitten", "unit": "g", "values": ["0"], "ri": null },
    { "name": "Zout", "unit": "g", "values": ["0"], "ri": null },
    { "name": "Vitamine E", "unit": "mg", "values": ["18"], "ri": "150" }
  ],
  "unreadable": [],
  "notes": "Foto geroteerd; spray 200 ml"
};

export const expected = {
  "name": "Olijfolie spray",
  "basis": "ml",
  "portion_size": null,
  "derived_from_portion": false,
  "per100": {
    "energy_kj": 3404,
    "energy_kcal": 828,
    "fat": 92,
    "saturates": 14,
    "unsaturates": null,
    "monounsaturates": null,
    "polyunsaturates": null,
    "carbohydrate": 0,
    "sugars": 0,
    "fibre": 0,
    "protein": 0,
    "salt": 0,
    "sodium": null
  },
  "portion": null,
  "extras": [
    { "name": "Vitamine E", "amount": 18, "unit": "mg", "ri_percent": 150 }
  ],
  "unreadable": [],
  "notes": "Foto geroteerd; spray 200 ml"
};