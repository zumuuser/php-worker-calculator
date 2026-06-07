"use client";

import { useState, useEffect } from "react";
import { SavedReport } from "@/types";
import { getReports, deleteReport, exportReportsJson } from "@/lib/storage";
import { X, Trash2, Download, Upload, History, Layers } from "lucide-react";

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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            Saved Reports
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex gap-3">
          <button
            onClick={handleExport}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
          <label className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Import JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {reports.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No saved reports yet. Run a calculation to save one.
              </p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all cursor-pointer"
                onClick={() => onLoad(report)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{report.domain}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-xs font-bold text-blue-700 dark:text-blue-400">
                        <Layers className="w-3 h-3" />
                        {report.result.recommendedWorkers} workers
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(report.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(report.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
