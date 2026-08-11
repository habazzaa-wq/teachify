"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQ_ITEMS } from "@/features/marketing/data/content";

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="grid gap-3">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className="overflow-hidden rounded-xl border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] transition-colors duration-300"
            style={isOpen ? { borderColor: "hsl(var(--mk-primary) / 0.4)" } : undefined}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
            >
              <span className="text-[0.92rem] font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
                {item.q}
              </span>
              <ChevronDown
                size={17}
                className="shrink-0 text-[hsl(var(--mk-primary-deep))] transition-transform duration-300"
                style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
              />
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p
                  className="px-5 pb-5 text-[0.85rem] leading-7"
                  style={{ color: "hsl(var(--mk-ink-soft))" }}
                >
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
