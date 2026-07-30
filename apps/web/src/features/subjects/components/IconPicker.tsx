"use client";

import { cn } from "@/lib/cn";
import {
  BookOpen,
  BookMarked,
  BookText,
  Calculator,
  Sigma,
  Hash,
  FlaskConical,
  Beaker,
  Atom,
  Dna,
  Globe,
  Map,
  Landmark,
  Scroll,
  Palette,
  Paintbrush,
  Music,
  Dumbbell,
  Monitor,
  Code,
  Brain,
  Heart,
  Languages,
  GraduationCap,
  Leaf,
  Microscope,
  Telescope,
  Pen,
  Compass,
  type LucideIcon,
} from "lucide-react";

const subjectIcons: { label: string; icon: LucideIcon }[] = [
  { label: "عام", icon: BookOpen },
  { label: "قراءة", icon: BookMarked },
  { label: "لغة", icon: BookText },
  { label: "رياضيات", icon: Calculator },
  { label: "رياضيات", icon: Sigma },
  { label: "أرقام", icon: Hash },
  { label: "علوم", icon: FlaskConical },
  { label: "كيمياء", icon: Beaker },
  { label: "فيزياء", icon: Atom },
  { label: "أحياء", icon: Dna },
  { label: "جغرافيا", icon: Globe },
  { label: "خرائط", icon: Map },
  { label: "تاريخ", icon: Landmark },
  { label: "مخطوطات", icon: Scroll },
  { label: "فن", icon: Palette },
  { label: "رسم", icon: Paintbrush },
  { label: "موسيقى", icon: Music },
  { label: "رياضة", icon: Dumbbell },
  { label: "حاسوب", icon: Monitor },
  { label: "برمجة", icon: Code },
  { label: "عقل", icon: Brain },
  { label: "صحة", icon: Heart },
  { label: "لغات", icon: Languages },
  { label: "تخرج", icon: GraduationCap },
  { label: "بيئة", icon: Leaf },
  { label: "مجهر", icon: Microscope },
  { label: "فلك", icon: Telescope },
  { label: "كتابة", icon: Pen },
  { label: "اتجاه", icon: Compass },
];

interface IconPickerProps {
  value: string | null;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
      {subjectIcons.map(({ label, icon: Icon }) => {
        const iconName = Icon.displayName ?? Icon.name;
        const selected = value === iconName;
        return (
          <button
            key={iconName}
            type="button"
            title={label}
            onClick={() => onChange(iconName)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors",
              selected
                ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                : "border-border text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] leading-tight">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
