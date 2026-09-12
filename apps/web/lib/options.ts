export const TONES = [
  { value: "professional", label: "Professional", description: "Clear and credible" },
  { value: "friendly", label: "Friendly", description: "Warm and approachable" },
  { value: "luxury", label: "Luxury", description: "Polished and exclusive" },
  { value: "casual", label: "Casual", description: "Relaxed and conversational" },
  { value: "bold", label: "Bold", description: "Confident and energetic" },
  { value: "formal", label: "Formal", description: "Measured and traditional" },
  { value: "playful", label: "Playful", description: "Bright and imaginative" },
  { value: "minimal", label: "Minimal", description: "Brief and understated" },
] as const;

export type Tone = (typeof TONES)[number]["value"];

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "nl", label: "Dutch" },
] as const;

export type Language = (typeof LANGUAGES)[number]["value"];

export function isTone(value: string): value is Tone {
  return TONES.some((tone) => tone.value === value);
}

export function isLanguage(value: string): value is Language {
  return LANGUAGES.some((language) => language.value === value);
}
