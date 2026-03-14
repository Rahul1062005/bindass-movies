"use client";

import { useEffect } from "react";
import styles from "./theme-toggle.module.css";

type Theme = "dark" | "light";

const STORAGE_KEY = "bindass-theme";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function getStoredTheme(): Theme {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "dark";
}

function getActiveTheme(): Theme {
  const active = document.documentElement.getAttribute("data-theme");
  return active === "light" ? "light" : "dark";
}

export function ThemeToggle() {
  useEffect(() => {
    const initialTheme = getStoredTheme();
    applyTheme(initialTheme);
  }, []);

  function handleToggle() {
    const updatedTheme: Theme = getActiveTheme() === "dark" ? "light" : "dark";

    applyTheme(updatedTheme);
    window.localStorage.setItem(STORAGE_KEY, updatedTheme);
  }

  return (
    <button
      className={styles.button}
      type="button"
      onClick={handleToggle}
      aria-label="Toggle color theme"
      title="Toggle color theme"
    >
      <span className={styles.indicator} aria-hidden="true" />
      <span className={styles.label}>Toggle Theme</span>
    </button>
  );
}