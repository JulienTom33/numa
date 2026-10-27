import { isRecord } from "../chat/guards.ts";

export const SECTION_KEYS = ["general", "relations", "work", "energy"] as const;

export type SectionKey = typeof SECTION_KEYS[number];

export type HoroscopeSections = Record<SectionKey, string>;

const HEADER = /^\[(general|relations|work|energy)\]$/;
const CATEGORICAL =
  /\b(vous allez|toujours|jamais|certainement|forcément|inévitablement|sans aucun doute)\b|\bvous êtes\b(?!\s+peut-être\b)/i;

function isSectionKey(value: string): value is SectionKey {
  return SECTION_KEYS.some((key) => key === value);
}

export function parseSections(text: string): HoroscopeSections | null {
  const lines: Record<SectionKey, string[]> = { general: [], relations: [], work: [], energy: [] };
  let current: SectionKey | null = null;

  for (const line of text.split("\n")) {
    const match = HEADER.exec(line.trim().toLowerCase());
    if (match && isSectionKey(match[1])) {
      current = match[1];
    } else if (current !== null) {
      lines[current].push(line.trim());
    }
  }

  const body = (key: SectionKey) => lines[key].join(" ").replace(/\s+/g, " ").trim();
  const sections: HoroscopeSections = {
    general: body("general"),
    relations: body("relations"),
    work: body("work"),
    energy: body("energy"),
  };
  const invalid = SECTION_KEYS.some((key) =>
    sections[key] === "" || CATEGORICAL.test(sections[key])
  );
  return invalid ? null : sections;
}

export function readSections(value: unknown): HoroscopeSections | null {
  if (!isRecord(value)) return null;
  const { general, relations, work, energy } = value;
  if (
    typeof general !== "string" || typeof relations !== "string" || typeof work !== "string" ||
    typeof energy !== "string"
  ) {
    return null;
  }
  return { general, relations, work, energy };
}

export function joinSections(sections: HoroscopeSections): string {
  return SECTION_KEYS.map((key) => sections[key]).join("\n\n");
}
