"use client";

import type { LucideIcon } from "lucide-react";
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  Rocket,
  Atom,
  Globe,
  Lightbulb,
  Star,
  Zap,
  Brain,
  Layers,
  Compass,
  PenTool,
  Award,
  Crown,
  Gem,
  Heart,
  Languages,
  Medal,
  Palette,
  Puzzle,
  Shield,
  Smile,
  Target,
  Trophy,
  Wand2,
  BookMarked,
  Library,
  School,
  Presentation,
  MonitorPlay,
  Music,
  Users,
  Cpu,
  Microscope,
  Landmark,
  Leaf,
  Headphones,
  Megaphone,
} from "lucide-react";

export interface NavbarIconOption {
  key: string;
  label: string;
  icon: LucideIcon;
}

export const NAVBAR_ICON_OPTIONS: NavbarIconOption[] = [
  { key: "GraduationCap", label: "قبعة التخرج", icon: GraduationCap },
  { key: "BookOpen", label: "كتاب مفتوح", icon: BookOpen },
  { key: "BookMarked", label: "كتاب موسوم", icon: BookMarked },
  { key: "Library", label: "مكتبة", icon: Library },
  { key: "School", label: "مدرسة", icon: School },
  { key: "Presentation", label: "عرض تقديمي", icon: Presentation },
  { key: "MonitorPlay", label: "درس مرئي", icon: MonitorPlay },
  { key: "Sparkles", label: "تألق", icon: Sparkles },
  { key: "Rocket", label: "صاروخ", icon: Rocket },
  { key: "Atom", label: "ذرة", icon: Atom },
  { key: "Globe", label: "كرة أرضية", icon: Globe },
  { key: "Lightbulb", label: "مصباح فكرة", icon: Lightbulb },
  { key: "Star", label: "نجمة", icon: Star },
  { key: "Zap", label: "صاعقة", icon: Zap },
  { key: "Brain", label: "عقل", icon: Brain },
  { key: "Layers", label: "طبقات", icon: Layers },
  { key: "Compass", label: "بوصلة", icon: Compass },
  { key: "PenTool", label: "قلم رسم", icon: PenTool },
  { key: "Award", label: "جائزة", icon: Award },
  { key: "Crown", label: "تاج", icon: Crown },
  { key: "Gem", label: "جوهرة", icon: Gem },
  { key: "Heart", label: "قلب", icon: Heart },
  { key: "Languages", label: "لغات", icon: Languages },
  { key: "Medal", label: "ميدالية", icon: Medal },
  { key: "Palette", label: "لوحة ألوان", icon: Palette },
  { key: "Puzzle", label: "أحجية", icon: Puzzle },
  { key: "Shield", label: "درع", icon: Shield },
  { key: "Smile", label: "ابتسامة", icon: Smile },
  { key: "Target", label: "هدف", icon: Target },
  { key: "Trophy", label: "كأس", icon: Trophy },
  { key: "Wand2", label: "عصا سحرية", icon: Wand2 },
  { key: "Music", label: "نوتة موسيقية", icon: Music },
  { key: "Users", label: "مجموعة طلاب", icon: Users },
  { key: "Cpu", label: "معالج", icon: Cpu },
  { key: "Microscope", label: "مجهر", icon: Microscope },
  { key: "Landmark", label: "مبنى أثري", icon: Landmark },
  { key: "Leaf", label: "ورقة نبات", icon: Leaf },
  { key: "Headphones", label: "سماعات", icon: Headphones },
  { key: "Megaphone", label: "مكبر صوت", icon: Megaphone },
];

const NAVBAR_ICON_MAP = new Map(
  NAVBAR_ICON_OPTIONS.map((option) => [option.key, option]),
);

export function getNavbarIcon(key?: string | null): LucideIcon | null {
  if (!key) return null;
  return NAVBAR_ICON_MAP.get(key)?.icon ?? null;
}
