"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

const widgetVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.4 + i * 0.1,
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  }),
};

function FloatingWidget({
  className,
  children,
  index = 0,
  floatAmplitude = 6,
  floatDuration = 5,
}: {
  className?: string;
  children: React.ReactNode;
  index?: number;
  floatAmplitude?: number;
  floatDuration?: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={widgetVariants}
      initial="hidden"
      animate="visible"
      className={cn("absolute", className)}
    >
      <motion.div
        className="rounded-2xl border border-border/40 bg-card/95 shadow-lg shadow-black/[0.03] dark:shadow-black/[0.15] backdrop-blur-sm p-4"
        style={{ willChange: "transform" }}
        animate={{
          y: [0, -floatAmplitude, 0, floatAmplitude, 0],
        }}
        transition={{
          duration: floatDuration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 1.2,
          times: [0, 0.25, 0.5, 0.75, 1],
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function ProgressBar({ value, color = "bg-primary" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 rounded-full bg-muted w-full overflow-hidden">
      <motion.div
        className={cn("h-full rounded-full", color)}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
      />
    </div>
  );
}

function SparkLine() {
  const path = "M0,20 Q10,5 20,18 T40,10 T60,22 T80,8 T100,15";
  return (
    <svg viewBox="0 0 100 24" className="h-6 w-full" fill="none">
      <motion.path
        d={path}
        stroke="hsl(var(--primary) / 0.3)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, delay: 1.2, ease: "easeInOut" }}
      />
      <motion.circle
        cx="80"
        cy="8"
        r="3"
        fill="hsl(var(--primary))"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 3, ease: "backOut" }}
      />
    </svg>
  );
}

const CourseCard = memo(function CourseCard() {
  return (
    <FloatingWidget
      className="top-[5%] right-[5%] w-56"
      index={0}
      floatAmplitude={8}
      floatDuration={6}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <svg className="h-4 w-4 text-primary/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-foreground truncate">
            أساسيات البرمجة
          </p>
          <p className="text-[10px] text-muted-foreground/50">دورة مسجلة</p>
        </div>
      </div>
      <ProgressBar value={72} />
      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
            <span className="text-[6px] font-bold text-primary/60">أ</span>
          </div>
          <span className="text-[10px] text-muted-foreground/50">د. أحمد</span>
        </div>
        <span className="text-[10px] font-medium text-primary/60">٧٢٪</span>
      </div>
    </FloatingWidget>
  );
});

const AnalyticsCard = memo(function AnalyticsCard() {
  return (
    <FloatingWidget
      className="top-[2%] left-[5%] w-48"
      index={1}
      floatAmplitude={10}
      floatDuration={7}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-semibold text-foreground">نمو المنصة</span>
        <span className="text-[10px] font-bold text-success">+١٢٫٥٪</span>
      </div>
      <SparkLine />
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-muted-foreground/50">المستخدمون النشطون</span>
        <span className="text-[11px] font-bold text-foreground">٢٬٤٥٠</span>
      </div>
    </FloatingWidget>
  );
});

const StudentCard = memo(function StudentCard() {
  return (
    <FloatingWidget
      className="bottom-[15%] right-[3%] w-44"
      index={2}
      floatAmplitude={7}
      floatDuration={5.5}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span className="h-2 w-2 rounded-full bg-success animate-pulse-soft shrink-0" />
        <span className="text-[10px] font-medium text-foreground">نشاط حديث</span>
      </div>
      <div className="flex -space-x-1.5 rtl:space-x-reverse mb-2">
        {["أ", "س", "م", "ل"].map((letter, i) => (
          <div
            key={i}
            className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-card flex items-center justify-center"
          >
            <span className="text-[7px] font-bold text-primary/60">{letter}</span>
          </div>
        ))}
        <div className="h-6 w-6 rounded-full bg-muted border-2 border-card flex items-center justify-center">
          <span className="text-[7px] font-semibold text-muted-foreground/50">+٣</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground/50">انضموا اليوم</p>
    </FloatingWidget>
  );
});

const CertificateCard = memo(function CertificateCard() {
  return (
    <FloatingWidget
      className="bottom-[25%] left-[8%] w-44"
      index={3}
      floatAmplitude={9}
      floatDuration={6.5}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div className="h-7 w-7 rounded-lg bg-success/10 flex items-center justify-center">
          <svg className="h-3.5 w-3.5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] font-bold text-foreground">٤٨ شهادة</p>
          <p className="text-[9px] text-muted-foreground/50">هذا الأسبوع</p>
        </div>
      </div>
      <div className="rounded-lg bg-success/[0.06] border border-success/[0.1] px-2.5 py-1.5">
        <p className="text-[9px] text-success/80 font-medium text-center">
          تم إصدار ١٢ شهادة اليوم
        </p>
      </div>
    </FloatingWidget>
  );
});

const VideoCard = memo(function VideoCard() {
  return (
    <FloatingWidget
      className="bottom-[5%] left-[30%] w-40"
      index={4}
      floatAmplitude={6}
      floatDuration={5}
    >
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
          <svg className="h-3.5 w-3.5 text-destructive/70" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] font-medium text-foreground">درس جديد</p>
          <p className="text-[9px] text-muted-foreground/50">المدة: ١٥ دقيقة</p>
        </div>
      </div>
    </FloatingWidget>
  );
});

const DashboardCard = memo(function DashboardCard() {
  return (
    <FloatingWidget
      className="bottom-[38%] right-[28%] w-52"
      index={5}
      floatAmplitude={5}
      floatDuration={8}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-foreground">لوحة التحكم</span>
        <span className="text-[9px] text-muted-foreground/40">آخر ٣٠ يوم</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-2.5">
        {[
          { value: "١٢", label: "دورة" },
          { value: "٤٨", label: "شهادة" },
          { value: "٩٢", label: "طالب" },
        ].map((stat, i) => (
          <div key={i} className="rounded-lg bg-muted/50 text-center py-1.5">
            <p className="text-xs font-bold text-foreground">{stat.value}</p>
            <p className="text-[8px] text-muted-foreground/50">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/40">
        <span className="h-1 w-1 rounded-full bg-primary/40" />
        نشاط متزايد هذا الأسبوع
      </div>
    </FloatingWidget>
  );
});

const LmsWidgets = memo(function LmsWidgets() {
  return (
    <div className="relative h-[420px] lg:h-[520px] w-full" aria-hidden="true">
      <CourseCard />
      <AnalyticsCard />
      <StudentCard />
      <CertificateCard />
      <VideoCard />
      <DashboardCard />
    </div>
  );
});

export { LmsWidgets };
