import {
  Award,
  BookOpen,
  Compass,
  Globe,
  GraduationCap,
  Heart,
  Lightbulb,
  Rocket,
  School,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { AboutIconName } from "./types";

export const ABOUT_ICONS = {
  Award,
  BookOpen,
  Compass,
  Globe,
  GraduationCap,
  Heart,
  Lightbulb,
  Rocket,
  School,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
} satisfies Record<AboutIconName, typeof Award>;

export function getAboutIcon(name: AboutIconName) {
  return ABOUT_ICONS[name] ?? Compass;
}

export function AboutIcon({ name, ...props }: LucideProps & { name: AboutIconName }) {
  switch (name) {
    case "Award": return <Award {...props} />;
    case "BookOpen": return <BookOpen {...props} />;
    case "Compass": return <Compass {...props} />;
    case "Globe": return <Globe {...props} />;
    case "GraduationCap": return <GraduationCap {...props} />;
    case "Heart": return <Heart {...props} />;
    case "Lightbulb": return <Lightbulb {...props} />;
    case "Rocket": return <Rocket {...props} />;
    case "School": return <School {...props} />;
    case "ShieldCheck": return <ShieldCheck {...props} />;
    case "Sparkles": return <Sparkles {...props} />;
    case "Star": return <Star {...props} />;
    case "Target": return <Target {...props} />;
    case "Users": return <Users {...props} />;
  }
}
