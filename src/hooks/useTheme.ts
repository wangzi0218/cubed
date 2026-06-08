import { useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
    return "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (theme === "system") {
      return getSystemTheme();
    }
    return theme;
  });

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem("theme", t);
    setThemeState(t);
  }, []);

  // Apply theme and listen for system preference changes
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    function handleChange() {
      if (theme === "system") {
        const resolved = getSystemTheme();
        setResolvedTheme(resolved);
        applyTheme(resolved);
      }
    }

    // Apply current theme immediately
    const resolved = theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(resolved);
    applyTheme(resolved);

    // Listen for live system preference updates
    mql.addEventListener("change", handleChange);
    return () => {
      mql.removeEventListener("change", handleChange);
    };
  }, [theme]);

  return { theme, setTheme, resolvedTheme };
}
