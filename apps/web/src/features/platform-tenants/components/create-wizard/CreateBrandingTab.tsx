"use client";

import { useState, useRef } from "react";
import {
  AppInput,
  AppCard,
  AppCardContent,
} from "@/components/ui";
import { Image as ImageIcon, Palette, Upload, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface CreateBrandingTabProps {
  data: {
    companyName: string;
    logo: string | null;
    primaryColor: string;
    secondaryColor: string;
    supportEmail: string;
    favicon: string | null;
  };
  errors: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const MAX_FAVICON_SIZE = 1 * 1024 * 1024;

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("فشل قراءة الملف"));
    reader.readAsDataURL(file);
  });
}

function CreateBrandingTab({ data, errors, onChange }: CreateBrandingTabProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [faviconError, setFaviconError] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [faviconLoading, setFaviconLoading] = useState(false);

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);

    if (!file.type.startsWith("image/")) {
      setLogoError("يجب أن يكون الملف صورة");
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setLogoError("حجم الملف يجب ألا يتجاوز 2 ميجابايت");
      return;
    }

    setLogoLoading(true);
    try {
      const dataUrl = await readFileAsDataURL(file);
      onChange("logo", dataUrl);
    } catch {
      setLogoError("فشل قراءة الملف");
    } finally {
      setLogoLoading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleFaviconSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFaviconError(null);

    if (!file.type.startsWith("image/")) {
      setFaviconError("يجب أن يكون الملف صورة");
      return;
    }

    if (file.size > MAX_FAVICON_SIZE) {
      setFaviconError("حجم الملف يجب ألا يتجاوز 1 ميجابايت");
      return;
    }

    setFaviconLoading(true);
    try {
      const dataUrl = await readFileAsDataURL(file);
      onChange("favicon", dataUrl);
    } catch {
      setFaviconError("فشل قراءة الملف");
    } finally {
      setFaviconLoading(false);
      if (faviconInputRef.current) faviconInputRef.current.value = "";
    }
  };

  const removeLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("logo", "");
    setLogoError(null);
  };

  const removeFavicon = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("favicon", "");
    setFaviconError(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          اسم الشركة <span className="text-destructive">*</span>
        </label>
        <AppInput
          value={data.companyName}
          onChange={(e) => onChange("companyName", e.target.value)}
          placeholder="مثال: أكاديمية البرمجة"
        />
        {errors.companyName && (
          <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{errors.companyName}</p>
        )}
      </div>

      <AppCard>
        <AppCardContent className="p-4 space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            الشعار والأيقونة
          </h4>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">الشعار</label>
              <div
                onClick={() => logoInputRef.current?.click()}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors",
                  data.logo
                    ? "border-primary/30 bg-primary/5"
                    : "border-muted-foreground/25 bg-muted/20 hover:border-muted-foreground/50 hover:bg-muted/30",
                  logoLoading && "opacity-50 pointer-events-none",
                )}
              >
                {logoLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-xs text-muted-foreground">جاري التحميل...</span>
                  </div>
                ) : data.logo ? (
                  <div className="relative group w-full flex flex-col items-center gap-2">
                    <img
                      src={data.logo}
                      alt="الشعار"
                      className="max-h-24 max-w-full object-contain rounded-lg"
                    />
                    <span className="text-xs text-muted-foreground">انقر لتغيير الشعار</span>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -end-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground/60" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">ارفع شعار المؤسسة</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, WebP, SVG — حتى 2MB</p>
                    </div>
                  </>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoSelect}
                className="hidden"
              />
              {logoError && (
                <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{logoError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الأيقونة (Favicon)</label>
              <div
                onClick={() => faviconInputRef.current?.click()}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 cursor-pointer transition-colors",
                  data.favicon
                    ? "border-primary/30 bg-primary/5"
                    : "border-muted-foreground/25 bg-muted/20 hover:border-muted-foreground/50 hover:bg-muted/30",
                  faviconLoading && "opacity-50 pointer-events-none",
                )}
              >
                {faviconLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : data.favicon ? (
                  <div className="relative group w-full flex flex-col items-center gap-2">
                    <img
                      src={data.favicon}
                      alt="الأيقونة"
                      className="h-12 w-12 object-contain rounded-lg"
                    />
                    <span className="text-xs text-muted-foreground">انقر لتغيير الأيقونة</span>
                    <button
                      type="button"
                      onClick={removeFavicon}
                      className="absolute -top-2 -end-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground/60" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">ارفع أيقونة المتصفح</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">PNG, ICO, SVG — حتى 1MB</p>
                    </div>
                  </>
                )}
              </div>
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/png,image/x-icon,image/svg+xml,.ico"
                onChange={handleFaviconSelect}
                className="hidden"
              />
              {faviconError && (
                <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{faviconError}</p>
              )}
            </div>
          </div>
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardContent className="p-4 space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            الألوان
          </h4>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">اللون الأساسي</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={data.primaryColor}
                  onChange={(e) => onChange("primaryColor", e.target.value)}
                  className="h-10 w-10 rounded-lg border cursor-pointer bg-transparent"
                />
                <span className="text-sm font-mono">{data.primaryColor}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">اللون الثانوي</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={data.secondaryColor}
                  onChange={(e) => onChange("secondaryColor", e.target.value)}
                  className="h-10 w-10 rounded-lg border cursor-pointer bg-transparent"
                />
                <span className="text-sm font-mono">{data.secondaryColor}</span>
              </div>
            </div>
          </div>
        </AppCardContent>
      </AppCard>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          البريد الإلكتروني للدعم <span className="text-destructive">*</span>
        </label>
        <AppInput
          type="email"
          value={data.supportEmail}
          onChange={(e) => onChange("supportEmail", e.target.value)}
          placeholder="support@academy.com"
          dir="ltr"
          className={errors.supportEmail ? "border-destructive ring-destructive/30" : ""}
        />
        {errors.supportEmail && (
          <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{errors.supportEmail}</p>
        )}
      </div>
    </div>
  );
}

export { CreateBrandingTab };
