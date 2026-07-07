"use client";

import { useState, useCallback, useMemo } from "react";
import {
  AppDialog,
  AppDialogContent,
  AppButton,
} from "@/components/ui";
import { Check, Copy, ExternalLink, X, Terminal, Globe } from "lucide-react";

interface CreateSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: {
    name: string;
    subdomain: string;
    ownerName: string;
    ownerEmail: string;
    password: string;
    loginUrl: string;
  } | null;
}

function CreateSuccessDialog({ open, onOpenChange, result }: CreateSuccessDialogProps) {
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedHostCmd, setCopiedHostCmd] = useState(false);

  const fullDomain = useMemo(() => {
    if (!result?.loginUrl) return "";
    try {
      return new URL(result.loginUrl).host;
    } catch {
      return result.subdomain;
    }
  }, [result?.loginUrl]);

  const hostsCommand = useMemo(() => {
    return `npm run add-domain -- ${fullDomain} 3000 --open`;
  }, [fullDomain]);

  const hostsManualCommand = useMemo(() => {
    return `Add-Content -LiteralPath "$env:SystemRoot\\System32\\drivers\\etc\\hosts" -Value "\`n127.0.0.1\t${fullDomain}"`;
  }, [fullDomain]);

  const handleCopyPassword = useCallback(async () => {
    if (!result?.password) return;
    try {
      await navigator.clipboard.writeText(result.password);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = result.password;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  }, [result?.password]);

  const handleCopyUrl = useCallback(async () => {
    if (!result?.loginUrl) return;
    try {
      await navigator.clipboard.writeText(result.loginUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = result.loginUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }, [result?.loginUrl]);

  const handleCopyHostCmd = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(hostsManualCommand);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = hostsManualCommand;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedHostCmd(true);
    setTimeout(() => setCopiedHostCmd(false), 2000);
  }, [hostsManualCommand]);

  const handleOpenTenant = useCallback(() => {
    if (result?.loginUrl) window.open(result.loginUrl, "_blank");
  }, [result?.loginUrl]);

  if (!result) return null;

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="sm:max-w-md !m-auto !inset-0 !translate-x-0 !translate-y-0 overflow-visible">
        <div className="flex flex-col items-center py-8 px-2 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10 animate-in zoom-in duration-500">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/20">
              <Check className="h-8 w-8 text-success animate-in zoom-in duration-500 delay-200 fill-mode-both" />
            </div>
          </div>

          <h2 className="mb-1 text-2xl font-bold animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 fill-mode-both">
            تم إنشاء المؤسسة بنجاح
          </h2>
          <p className="mb-6 text-muted-foreground text-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-400 fill-mode-both">
            تم إنشاء حساب المؤسسة وتجهيزها للاستخدام
          </p>

          <div className="w-full space-y-3 rounded-lg border bg-card p-4 text-start animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500 fill-mode-both">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">المؤسسة</span>
              <span className="font-semibold">{result.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">النطاق</span>
              <span className="font-semibold font-mono text-xs">{result.subdomain}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">المالك</span>
              <span className="font-semibold">{result.ownerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">البريد</span>
              <span className="font-semibold">{result.ownerEmail}</span>
            </div>
            <div className="flex items-center justify-between text-sm border-t pt-3 mt-3">
              <span className="text-muted-foreground">كلمة المرور</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{result.password}</span>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="نسخ كلمة المرور"
                >
                  {copiedPassword ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">رابط تسجيل الدخول</span>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded truncate max-w-[180px]">{result.loginUrl}</span>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="نسخ الرابط"
                >
                  {copiedUrl ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {fullDomain && (
            <div className="w-full rounded-lg border border-primary/20 bg-primary/5 p-3 text-start animate-in fade-in slide-in-from-bottom-2 duration-500 delay-600 fill-mode-both">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">إعدادات البيئة المحلية</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                لإضافة النطاق <span className="font-mono font-semibold">{fullDomain}</span> إلى ملف hosts على جهازك المحلي:
              </p>
              <div className="flex items-center gap-2">
                <AppButton
                  variant="outline"
                  size="sm"
                  onClick={handleCopyHostCmd}
                  className="text-xs font-mono h-8"
                >
                  {copiedHostCmd ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                  {copiedHostCmd ? "تم النسخ" : "نسخ أمر PowerShell"}
                </AppButton>
                <AppButton
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`http://${fullDomain}:3000`, "_blank")}
                  className="text-xs h-8"
                >
                  <Globe className="h-3 w-3" />
                  فتح {fullDomain}:3000
                </AppButton>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3 justify-center animate-in fade-in duration-500 delay-700 fill-mode-both">
            <AppButton variant="outline" onClick={handleCopyPassword}>
              <Copy className="h-4 w-4" />
              نسخ كلمة المرور
            </AppButton>
            <AppButton variant="outline" onClick={handleCopyUrl}>
              <Copy className="h-4 w-4" />
              نسخ رابط الدخول
            </AppButton>
            <AppButton variant="default" onClick={handleOpenTenant}>
              <ExternalLink className="h-4 w-4" />
              فتح المؤسسة
            </AppButton>
          </div>

          <AppButton
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="mt-4"
          >
            <X className="h-4 w-4" />
            إغلاق
          </AppButton>
        </div>
      </AppDialogContent>
    </AppDialog>
  );
}

export { CreateSuccessDialog };
