"use client";

import { useEffect, useState } from "react";
import { Globe, Search } from "lucide-react";
import type { Category } from "../types";

interface CategorySEOTabProps {
  category: Category;
}

function CategorySEOTab({ category }: CategorySEOTabProps) {
  const seo = category.seo;
  const [slugPreview, setSlugPreview] = useState("");

  useEffect(() => {
    setSlugPreview(`${window.location.origin}/categories/${category.slug}`);
  }, [category.slug]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 bg-muted/5">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Globe className="h-3.5 w-3.5" />
          معاينة الرابط
        </h4>
        <div className="rounded-md border bg-card p-3">
          <p className="text-sm text-primary font-medium truncate">{seo.title || category.name}</p>
          <p className="text-xs text-green-600 dark:text-green-400 truncate">{slugPreview}</p>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{seo.description || category.description}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">عنوان SEO</h4>
          </div>
          <p className="text-sm">{seo.title || "—"}</p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">وصف SEO</h4>
          </div>
          <p className="text-sm">{seo.description || "—"}</p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">الكلمات المفتاحية</h4>
          </div>
          <p className="text-sm">{seo.keywords || "—"}</p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">الرابط المختصر</h4>
          </div>
          <p className="text-sm font-mono" dir="ltr">{slugPreview}</p>
        </div>
      </div>
    </div>
  );
}

export { CategorySEOTab };