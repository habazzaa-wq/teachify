"use client";

import {
  Eye,
  Clock,
  Archive,
  Lock,
  Shield,
  Star,
  Crown,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { StudioBadge, type BadgeTone } from "./StudioBadge";

interface StatusBadgeConfig {
  label: string;
  tone: BadgeTone;
  icon: React.ReactNode;
}

const statusMap: Record<string, StatusBadgeConfig> = {
  published: { label: "منشور", tone: "success", icon: <CheckCircle className="h-3 w-3" /> },
  draft: { label: "مسودة", tone: "warning", icon: <Clock className="h-3 w-3" /> },
  archived: { label: "مؤرشف", tone: "default", icon: <Archive className="h-3 w-3" /> },
  locked: { label: "مقفل", tone: "danger", icon: <Lock className="h-3 w-3" /> },
  private: { label: "خاص", tone: "info", icon: <Shield className="h-3 w-3" /> },
  featured: { label: "مميز", tone: "accent", icon: <Star className="h-3 w-3" /> },
  premium: { label: "بريميوم", tone: "premium", icon: <Crown className="h-3 w-3" /> },
  new: { label: "جديد", tone: "accent", icon: <Sparkles className="h-3 w-3" /> },
};

interface StudioStatusBadgeProps {
  status: string;
}

export function StudioStatusBadge({ status }: StudioStatusBadgeProps) {
  const config = statusMap[status];

  if (!config) return null;

  return (
    <StudioBadge tone={config.tone} size="sm" icon={config.icon}>
      {config.label}
    </StudioBadge>
  );
}

export function DraftBadge() {
  return <StudioStatusBadge status="draft" />;
}

export function ArchivedBadge() {
  return <StudioStatusBadge status="archived" />;
}

export function LockedBadge() {
  return <StudioStatusBadge status="locked" />;
}

export function PrivateBadge() {
  return <StudioStatusBadge status="private" />;
}

export function FeaturedBadge() {
  return <StudioStatusBadge status="featured" />;
}

export function PremiumBadge() {
  return <StudioStatusBadge status="premium" />;
}

export function NewBadge() {
  return <StudioStatusBadge status="new" />;
}
