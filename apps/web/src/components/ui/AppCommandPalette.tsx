"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  ScrollText,
  Activity,
  Bell,
  Settings,
  Command,
  ArrowLeft,
  Clock,
  Star,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useUiStore } from "@/stores/ui.store";

interface CommandItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  category: string;
  shortcut?: string;
}

const defaultCommands: CommandItem[] = [
  { id: "dashboard", label: "لوحة القيادة", href: "/superadmin/dashboard", icon: LayoutDashboard, category: "الصفحات" },
  { id: "tenants", label: "المستأجرون", href: "/superadmin/tenants", icon: Building2, category: "الصفحات" },
  { id: "admins", label: "المشرفون", href: "/superadmin/admins", icon: Users, category: "الصفحات" },
  { id: "roles", label: "الصلاحيات", href: "/superadmin/roles", icon: ShieldCheck, category: "الصفحات" },
  { id: "audit", label: "سجل التدقيق", href: "/superadmin/audit", icon: ScrollText, category: "الصفحات" },
  { id: "activity", label: "النشاطات", href: "/superadmin/activity", icon: Activity, category: "الصفحات" },
  { id: "notifications", label: "الإشعارات", href: "/superadmin/notifications", icon: Bell, category: "الصفحات" },
  { id: "settings", label: "الإعدادات", href: "/superadmin/settings", icon: Settings, category: "الصفحات" },
];

const recentPages: CommandItem[] = [];
const pinnedPages: CommandItem[] = [];

interface AppCommandPaletteProps {
  extraCommands?: CommandItem[];
}

function AppCommandPalette({ extraCommands = [] }: AppCommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allCommands = useMemo(
    () => [...defaultCommands, ...extraCommands],
    [extraCommands],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return allCommands;
    const q = query.toLowerCase();
    return allCommands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q),
    );
  }, [query, allCommands]);

  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filtered.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category]!.push(cmd);
    });
    return groups;
  }, [filtered]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = useCallback(
    (item: CommandItem) => {
      router.push(item.href);
      setOpen(false);
    },
    [router],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        handleSelect(filtered[selectedIndex]);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [filtered, selectedIndex, handleSelect],
  );

  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector("[data-selected=true]");
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border bg-popover shadow-2xl animate-scale-up",
        )}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center border-b border-border/50 px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن صفحة أو أمر..."
            className="h-14 w-full bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground/50"
            aria-label="بحث في الأوامر"
          />
          <kbd className="hidden shrink-0 items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-1 text-[10px] text-muted-foreground/60 sm:flex">
            <Command className="h-3 w-3" />
            K
          </kbd>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              لا توجد نتائج
            </p>
            <p className="text-xs text-muted-foreground/60">
              لم نعثر على أي صفحة تطابق بحثك
            </p>
          </div>
        ) : (
          <div
            ref={listRef}
            className="max-h-[320px] overflow-y-auto scrollbar-thin p-2"
          >
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="mb-2 last:mb-0">
                <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                  {category}
                </p>
                {items.map((item, index) => {
                  const globalIndex = filtered.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      data-selected={globalIndex === selectedIndex}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm transition-colors",
                        globalIndex === selectedIndex
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground/80 hover:bg-accent/50",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="shrink-0 rounded border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground/60">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 border-t border-border/50 px-4 py-2.5 text-[10px] text-muted-foreground/50">
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-muted/50 px-1 py-0.5 text-[9px]">↑↓</kbd>
            التنقل
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-muted/50 px-1 py-0.5 text-[9px]">↵</kbd>
            فتح
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-muted/50 px-1 py-0.5 text-[9px]">ESC</kbd>
            إغلاق
          </span>
        </div>
      </div>
    </div>
  );
}

export { AppCommandPalette, type CommandItem, type AppCommandPaletteProps };
