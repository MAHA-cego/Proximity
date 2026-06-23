const PREFIX = "proximity:";

export const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = sessionStorage.getItem(PREFIX + key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown): void {
    try {
      sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {}
  },
  remove(key: string): void {
    try {
      sessionStorage.removeItem(PREFIX + key);
    } catch {}
  },
};
