"use client";

import { Moon, Sun } from "lucide-react";
import { useContext } from "react";

import { Button } from "@autosite/ui";

import { ThemeContext } from "./theme-provider";

export function ThemeToggle() {
  const context = useContext(ThemeContext);

  if (!context) {
    return null;
  }

  const nextTheme = context.theme === "dark" ? "light" : "dark";

  return (
    <Button
      variant="secondary"
      size="icon"
      aria-label={`Use ${nextTheme} mode`}
      title={`Use ${nextTheme} mode`}
      onClick={context.toggleTheme}
    >
      {context.theme === "dark" ? (
        <Sun aria-hidden="true" className="size-5" />
      ) : (
        <Moon aria-hidden="true" className="size-5" />
      )}
    </Button>
  );
}
