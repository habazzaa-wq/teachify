"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Globe } from "lucide-react";
import type { Course } from "@/features/courses/types";

interface WorkspaceSEOProps {
  course?: Course | null;
}

function WorkspaceSEO({ course }: WorkspaceSEOProps) {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (!course) return null;

  const seoTitle = course.seo?.title || course.title;
  const seoDesc = course.seo?.description || course.shortDescription || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center">
            <Search className="h-5 w-5 text-primary/60" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">معاينة محرك البحث</h4>
            <p className="text-xs text-muted-foreground/70">كيف سيظهر الرابط في نتائج البحث</p>
          </div>
        </div>
        <div className="rounded-xl border bg-muted/30 p-4 space-y-1.5">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">
            {origin || "example.com"}/{course.slug}
          </p>
          <p className="text-base text-blue-600 dark:text-blue-400 font-semibold truncate hover:underline cursor-pointer">
            {seoTitle}
          </p>
          <p className="text-sm text-muted-foreground/80 line-clamp-2">
            {seoDesc || "لا يوجد وصف"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary/60" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">بيانات SEO</h4>
            <p className="text-xs text-muted-foreground/70">العنوان والوصف والكلمات المفتاحية</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground/70 mb-1">العنوان</p>
            <p className="text-sm font-medium">{course.seo?.title || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground/70 mb-1">الوصف</p>
            <p className="text-sm">{course.seo?.description || "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground/70 mb-1">الكلمات المفتاحية</p>
            <p className="text-sm">{course.seo?.keywords || "—"}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { WorkspaceSEO };
