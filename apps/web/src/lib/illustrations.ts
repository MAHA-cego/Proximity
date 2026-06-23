const BASE = "/illustrations";

export function cardIllustrationSrc(cardId: string): string {
  return `${BASE}/cards/${cardId}.webp`;
}

export function encounterIllustrationSrc(encounterId: string): string {
  return `${BASE}/encounters/${encounterId}.webp`;
}

export const TITLE_ILLUSTRATION_SRC = `${BASE}/title.webp`;
