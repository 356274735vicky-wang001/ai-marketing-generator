"use client";

import * as React from "react";
import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { isValidHex, normalizeHexForComfy } from "@/lib/onething/hex";

interface ColorFieldProps {
  label: string;
  value: string; // 形如 #2563EB
  onChange: (hex: string) => void;
}

export function ColorField({ label, value, onChange }: ColorFieldProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const withHash = `#${normalizeHexForComfy(value)}`;
  const valid = isValidHex(value);

  return (
    <div className="space-y-1.5" ref={ref}>
      <span className="text-sm font-medium">{label}</span>
      <div className="relative flex items-center gap-2">
        <button
          type="button"
          aria-label={`${label}取色`}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "h-9 w-9 shrink-0 rounded-md border shadow-sm",
            !valid && "ring-1 ring-destructive"
          )}
          style={{ backgroundColor: valid ? withHash : "transparent" }}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#2563EB"
          spellCheck={false}
          className={cn("font-mono", !valid && "border-destructive")}
        />
        {open && (
          <div className="absolute left-0 top-11 z-50 rounded-lg border bg-background p-3 shadow-lg">
            <HexColorPicker
              color={valid ? withHash : "#2563EB"}
              onChange={(c) => onChange(c.toUpperCase())}
            />
          </div>
        )}
      </div>
    </div>
  );
}
