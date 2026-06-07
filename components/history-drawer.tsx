"use client";

import { useState, useEffect } from "react";
import { SavedReport } from "@/types";
import { getReports, deleteReport, exportReportsJson } from "@/lib/storage";
import { X, Trash2, Download, Upload, ArrowRight } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onLoad: (report: SavedReport) => void;
}

export default function HistoryDrawer({ open, onClose, onLoad }: Props) {
  const [reports, setReports] = useState<SavedReport[]>([]);

  useEffect(() => {
    if (open) setReports(getReports());
  }, [open]);

  const handleDelete = (id: string) => {
    deleteReport(id);
    setReports(getReports());
  };

  const handleExport = () => {
    const blob = new Blob([exportReportsJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `php-worker-reports-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const parsed = JSON.parse(text) as SavedReport[];
        if (typeof window !== "undefined") {
          localStorage.setItem("php-worker-reports", JSON.stringify(parsed));
          setReports(parsed);
        }
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 transition-opacity"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md h-full flex flex-col animate-fade-in"
        style={{
          background: "var(--color-bg)",
          borderLeft: "1px solid var(--color-border)",
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <h2 className="font-display text-lg font-medium tracking-tight">Saved reports</h2>
          <button
            onClick={onClose}
            className="p-2 transition-colors"
            style={{ color: "var(--color-fg-muted)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg-muted)"; }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className="px-6 py-4 border-b flex gap-3"
          style={{ borderColor: "var(--color-border)" }}
        >
          <button
            onClick={handleExport}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium tracking-wide uppercase border transition-colors"
            style={{ borderColor: "var(--color-border-strong)", color: "var(--color-fg)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-fg)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-strong)"; }}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <label className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium tracking-wide uppercase border transition-colors cursor-pointer"
            style={{ borderColor: "var(--color-border-strong)", color: "var(--color-fg)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-fg)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-strong)"; }}
          >
            <Upload className="w-3.5 h-3.5" />
            Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {reports.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: "var(--color-fg-muted)" }}>
                No saved reports yet.
              </p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="group border p-4 cursor-pointer transition-colors"
                style={{ borderColor: "var(--color-border)" }}
                onClick={() => onLoad(report)}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-fg)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{report.domain}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span
                        className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
                        style={{ background: "var(--color-fg)", color: "var(--color-bg)" }}
                      >
                        {report.result.recommendedWorkers} workers
                      </span>
                      <span className="text-xs" style={{ color: "var(--color-fg-muted)" }}>
                        {new Date(report.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--color-fg)" }} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(report.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 transition-opacity"
                      style={{ color: "var(--color-danger)" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
