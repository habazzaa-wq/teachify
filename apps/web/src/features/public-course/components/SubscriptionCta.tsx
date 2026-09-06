"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Crown, Play, FileText, ClipboardCheck, BadgeCheck, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import { CTA_GRADIENT } from "../brand";

interface SubscriptionCtaProps {
  onEnroll: () => void;
}

const perks = [
  { icon: Play, label: "وصول فوري لكل المحاضرات" },
  { icon: FileText, label: "ملفات وموارد للتحميل" },
  { icon: ClipboardCheck, label: "اختبارات بعد كل محاضرة" },
  { icon: BadgeCheck, label: "شهادة إتمام معتمدة" },
];

function SubscriptionCtaInner({ onEnroll }: SubscriptionCtaProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="scroll-mt-24"
    >
      <div
        className="relative overflow-hidden rounded-3xl p-8 text-center shadow-2xl shadow-[#BF6D58]/25 sm:p-12"
        style={{ background: CTA_GRADIENT }}
      >
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -start-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-20 -end-12 h-64 w-64 rounded-full bg-black/10" />

        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25">
            <Crown className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
              جاهز تبدأ رحلتك التعليمية؟
            </h2>
            <p className="text-sm leading-relaxed text-white/85 sm:text-base">
              اشترك الآن وافتح كل محتوى الدورة — محاضرات، ملفات، اختبارات وشهادة إتمام.
              رحلتك نحو التميز تبدأ من هنا.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            {perks.map((perk) => (
              <div
                key={perk.label}
                className="flex items-center gap-2.5 rounded-xl bg-white/10 px-4 py-3 text-start ring-1 ring-white/15"
              >
                <perk.icon className="h-4 w-4 shrink-0 text-[#FFB50E]" />
                <span className="text-xs font-bold text-white sm:text-sm">
                  {perk.label}
                </span>
              </div>
            ))}
          </div>

          <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <motion.button
              type="button"
              onClick={onEnroll}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl",
                "bg-white px-8 py-4 text-base font-extrabold text-[#BF6D58] shadow-lg shadow-black/20 sm:w-auto",
                "transition-shadow duration-300 hover:shadow-xl",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#BF6D58]",
              )}
            >
              <Zap className="h-5 w-5" />
              اشترك الآن
            </motion.button>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/85">
              <ShieldCheck className="h-4 w-4 text-[#FFB50E]" />
              ضمان استرجاع خلال 30 يومًا
            </span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

const SubscriptionCta = memo(SubscriptionCtaInner);

export { SubscriptionCta };
export type { SubscriptionCtaProps };
