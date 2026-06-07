"use client";

import { useTheme } from "./theme-provider";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const cycle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const icon =
    theme === "system" ? (
      <Monitor className="w-4 h-4" />
    ) : resolvedTheme === "dark" ? (
      <Moon className="w-4 h-4" />
    ) : (
      <Sun className="w-4 h-4" />
    );

  const label = theme === "system" ? "Auto" : resolvedTheme === "dark" ? "Dark" : "Light";

  return (
    <button
      onClick={cycle}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium tracking-wide uppercase text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors border border-[var(--color-border)] hover:border-[var(--color-fg)]"
      aria-label={`Theme: ${label}. Click to cycle.`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
