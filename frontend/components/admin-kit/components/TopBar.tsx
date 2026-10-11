'use client';
import React from "react";
import { Search, Bell } from "lucide-react";
import { Button } from "@/components/admin-kit/_deps/components/ui/button";
import { UserMenu } from "./UserMenu";
import { useDateRange } from "../contexts/DateRangeContext";
import { useCommandPalette } from "../lib/commands";

export function TopBar() {
  const { preset, setPreset } = useDateRange();
  const { open } = useCommandPalette();

  const presets = ["24h", "7d", "30d", "90d"] as const;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 glass-chrome border-b px-6">
      {/* Search / palette trigger */}
      <button
        onClick={open}
        className="flex items-center gap-2 rounded-lg border border-glass-hairline bg-surface-sunken px-3 py-1.5 text-sm text-ink-soft hover:bg-surface-sunken hover:text-ink-body transition-colors w-52"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] font-mono sm:block">
          ⌘K
        </kbd>
      </button>

      {/* Date range presets — hidden on mobile to prevent overflow */}
      <div className="hidden md:flex items-center gap-1">
        {presets.map((p) => (
          <Button
            key={p}
            variant="ghost"
            size="sm"
            onClick={() => setPreset(p)}
            className={`h-7 px-2 text-xs ${
              preset === p
                ? "bg-brand/10 text-brand"
                : "text-ink-soft hover:text-ink-body"
            }`}
          >
            {p}
          </Button>
        ))}
        {preset !== "7d" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreset("7d")}
            className="h-7 px-1.5 text-xs text-ink-faint hover:text-ink-body"
            title="Reset to default (7d)"
          >
            ✕
          </Button>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-ink-soft hover:text-ink-strong"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand" />
        </Button>
        <UserMenu />
      </div>
    </header>
  );
}
