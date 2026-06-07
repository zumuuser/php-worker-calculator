import { ApiKeys } from "@/types";

const STORAGE_KEY = "php-worker-api-keys";

export function getApiKeys(): ApiKeys {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ApiKeys;
  } catch {
    return {};
  }
}

export function setApiKeys(keys: ApiKeys): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function clearApiKeys(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
