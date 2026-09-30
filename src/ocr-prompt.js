// OCR prompt for the label photo (pure string builder, no I/O).

export const OCR_PROMPT = [
  "You are an exact OCR assistant for nutrition labels.",
  "",
  "Read the nutrition table in the photo and output strict JSON only — no markdown, no prose, no code fences.",
  "",
  "Requirements:",
  "- The photo may be rotated: read the label in any orientation.",
  "- Some areas may be blurry or partly covered by a finger: tolerate them, work around what you can still read, and never invent values you cannot see.",
  "- Labels are multilingual: support at least DE, FR, NL, IT, EN and ES.",
  "- Transcribe numbers exactly as printed, keeping comma decimals as commas (for example \"0,18\").",
  "- If a value is unreadable, do not guess: output null for that value and list the row or field name in \"unreadable\".",
  "",
  "Answer with this JSON schema:",
  "{",
  "  \"product_name\": \"string | null\",",
  "  \"basis\": \"g | ml | null\",",
  "  \"columns\": [{\"label\": \"string\", \"amount\": \"string | null\", \"unit\": \"string | null\"}],",
  "  \"rows\": [{\"name\": \"string\", \"unit\": \"string | null\", \"values\": [\"string | null\"], \"ri\": \"string | null\"}],",
  "  \"unreadable\": [\"string\"],",
  "  \"notes\": \"string | null\"",
  "}",
].join("\n");

export function buildOcrMessages(imageDataUrl) {
  return [
    {
      role: "user",
      content: [
        { type: "text", text: OCR_PROMPT },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ],
    },
  ];
}