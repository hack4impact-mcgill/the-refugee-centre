/** The languages volunteers speak and shifts can ask for. */
export const LANGUAGES = [
  "English",
  "French",
  "Arabic",
  "Spanish",
  "Ukrainian",
  "Russian",
  "Farsi",
  "Mandarin",
] as const;

export type Language = (typeof LANGUAGES)[number];
