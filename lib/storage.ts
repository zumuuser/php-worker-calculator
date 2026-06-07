import { SavedReport } from "@/types";

const STORAGE_KEY = "php-worker-reports";
const MAX_REPORTS = 10;

export function getReports(): SavedReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedReport[];
    return parsed.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

export function saveReport(report: SavedReport): void {
  if (typeof window === "undefined") return;
  const reports = getReports();
  const filtered = reports.filter((r) => r.id !== report.id);
  filtered.unshift(report);
  const trimmed = filtered.slice(0, MAX_REPORTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function deleteReport(id: string): void {
  if (typeof window === "undefined") return;
  const reports = getReports().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function exportReportsJson(): string {
  return JSON.stringify(getReports(), null, 2);
}

export function importReportsJson(json: string): SavedReport[] {
  const parsed = JSON.parse(json) as SavedReport[];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.slice(0, MAX_REPORTS)));
  }
  return parsed;
}
