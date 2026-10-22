"use client";
import { useState } from "react";

// A <details> whose open state is set once on mount, so it doesn't snap shut when the page re-renders after a save.
export function Collapsible({ title, initiallyOpen, children }: { title: string; initiallyOpen: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <details className="card" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="cursor-pointer font-medium">{title}</summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
