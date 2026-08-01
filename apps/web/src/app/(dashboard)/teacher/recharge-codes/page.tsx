"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  TicketCheck,
  Copy,
  Check,
  Search,
  Power,
  Banknote,
  Hash,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import {
  AppPage,
  AppPageHeader,
  AppDivider,
  AppButton,
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardDescription,
  AppInput,
  AppSwitch,
  AppStatusBadge,
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppDialogDescription,
  AppDialogFooter,
  AppLoadingState,
  AppEmptyState,
  AppProgress,
  AppPagination,
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
  AppConfirmDialog,
} from "@/components/ui";
import {
  useRechargeCodesList,
  useCreateRechargeCode,
  useGenerateRechargeCodes,
  useUpdateRechargeCode,
  useDeleteRechargeCode,
  useToggleRechargeCode,
} from "@/features/wallet/hooks";
import type { RechargeCodeInput, RechargeCodeRecord } from "@/features/wallet/types";
import { formatCurrency, formatRechargeCode } from "@/lib/format";

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000];
const PRESET_USES = [1, 5, 10, 25, 100];

function toLocalDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function codeStatus(item: RechargeCodeRecord): "active" | "inactive" {
  if (!item.is_active) return "inactive";
  if (item.expires_at && new Date(item.expires_at).getTime() < Date.now()) return "inactive";
  if (item.used_count >= item.max_uses) return "inactive";
  return "active";
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    toast.success("تم نسخ الكود");
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title="نسخ الكود"
      className="text-muted-foreground/50 hover:text-foreground transition-colors"
    >
      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

/* ────────────────────────────────────────────────
   Generate dialog
   ──────────────────────────────────────────────── */
function GenerateCodesDialog({
  open,
  onOpenChange,
  onGenerated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onGenerated: (codes: RechargeCodeRecord[]) => void;
}) {
  const generate = useGenerateRechargeCodes();
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [maxUses, setMaxUses] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(1);
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");

  const resolvedAmount = amount ?? (customAmount ? Number(customAmount) : null);

  const reset = () => {
    setAmount(null);
    setCustomAmount("");
    setMaxUses(1);
    setQuantity(1);
    setExpiresAt("");
    setError("");
  };

  const handleSubmit = () => {
    if (!resolvedAmount || resolvedAmount < 1) {
      setError("أدخل مبلغاً صحيحاً");
      return;
    }
    generate.mutate(
      {
        amount: resolvedAmount,
        max_uses: maxUses,
        expires_at: expiresAt ? `${expiresAt} 23:59:59` : undefined,
        quantity,
      },
      {
        onSuccess: (data) => {
          onGenerated(Array.isArray(data) ? data : [data]);
          onOpenChange(false);
        },
      },
    );
    reset();
  };

  return (
    <AppDialog open={open} onOpenChange={(v) => { if (!generate.isPending) onOpenChange(v); }}>
      <AppDialogContent className="max-w-lg">
        <AppDialogHeader>
          <AppDialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-warning" /> توليد أكواد شحن
          </AppDialogTitle>
          <AppDialogDescription>
            توليد أكواد شحن عشوائية برصيد محدد، جاهزة للتوزيع على الطلاب
          </AppDialogDescription>
        </AppDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="mb-2 block text-sm font-medium">قيمة الكود الواحد</label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setAmount(value); setCustomAmount(""); setError(""); }}
                  className={cn(
                    "h-9 rounded-lg border text-xs font-bold transition-all",
                    amount === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/40",
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
            <AppInput
              type="number"
              min={1}
              placeholder="أو مبلغ مخصص..."
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setAmount(null); setError(""); }}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium">عدد مرات الاستخدام</label>
              <div className="grid grid-cols-5 gap-1.5">
                {PRESET_USES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMaxUses(value)}
                    className={cn(
                      "h-8 rounded-lg border text-xs font-semibold transition-all",
                      maxUses === value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/40",
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">عدد الأكواد</label>
              <AppInput
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">تاريخ الانتهاء (اختياري)</label>
            <AppInput
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>

        <AppDialogFooter>
          <AppButton variant="outline" onClick={() => onOpenChange(false)} disabled={generate.isPending}>
            إلغاء
          </AppButton>
          <AppButton onClick={handleSubmit} loading={generate.isPending}>
            <Sparkles className="h-4 w-4" /> توليد {quantity > 1 ? `${quantity} أكواد` : "الكود"}
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

/* ────────────────────────────────────────────────
   Create / Edit dialog (manual code)
   ──────────────────────────────────────────────── */
function CodeFormDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: RechargeCodeRecord | null;
}) {
  const create = useCreateRechargeCode();
  const update = useUpdateRechargeCode();
  const [form, setForm] = useState<RechargeCodeInput>(() =>
    initial
      ? {
          code: formatRechargeCode(initial.code),
          amount: Number(initial.amount),
          max_uses: initial.max_uses,
          expires_at: toLocalDate(initial.expires_at) || null,
          is_active: initial.is_active,
        }
      : { code: "", amount: 100, max_uses: 1, expires_at: null, is_active: true },
  );

  const saving = create.isPending || update.isPending;

  const handleSave = () => {
    const payload: RechargeCodeInput = {
      code: form.code ? form.code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : undefined,
      amount: Number(form.amount),
      max_uses: form.max_uses,
      expires_at: form.expires_at ? `${form.expires_at} 23:59:59` : null,
      is_active: form.is_active,
    };
    if (initial) {
      update.mutate({ id: initial.id, payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <AppDialog open={open} onOpenChange={(v) => { if (!saving) onOpenChange(v); }}>
      <AppDialogContent className="max-w-lg">
        <AppDialogHeader>
          <AppDialogTitle>{initial ? "تعديل كود الشحن" : "إضافة كود شحن يدوي"}</AppDialogTitle>
          <AppDialogDescription>
            {initial
              ? "عدّل بيانات الكود (لا يمكن تغيير المبلغ بعد استخدامه)"
              : "أنشئ كوداً مخصصاً بقيمة تحددها"}
          </AppDialogDescription>
        </AppDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="mb-2 block text-sm font-medium">
              الكود {initial ? "" : <span className="text-muted-foreground text-xs font-normal">(اتركه فارغاً للتوليد تلقائياً)</span>}
            </label>
            <div className="relative">
              <AppInput
                dir="ltr"
                className="ps-9 font-mono font-semibold tracking-widest"
                placeholder="ABC123DEF4"
                value={form.code ?? ""}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
              <TicketCheck className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="mb-2 block text-sm font-medium">المبلغ <span className="text-destructive">*</span></label>
              <AppInput
                type="number"
                min={1}
                value={form.amount}
                disabled={!!initial && initial.used_count > 0}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="mb-2 block text-sm font-medium">عدد مرات الاستخدام <span className="text-destructive">*</span></label>
              <AppInput
                type="number"
                min={1}
                value={form.max_uses}
                disabled={!!initial && initial.used_count > 0}
                onChange={(e) => setForm({ ...form, max_uses: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="mb-2 block text-sm font-medium">تاريخ الانتهاء (اختياري)</label>
            <AppInput
              type="date"
              value={form.expires_at ?? ""}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value || null })}
            />
          </div>

          <label className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <span className="text-sm font-medium">كود نشط</span>
            <AppSwitch
              checked={!!form.is_active}
              onCheckedChange={(v) => setForm({ ...form, is_active: v })}
            />
          </label>
        </div>

        <AppDialogFooter>
          <AppButton variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            إلغاء
          </AppButton>
          <AppButton onClick={handleSave} loading={saving} disabled={!form.amount || form.amount < 1}>
            {initial ? "حفظ التعديلات" : "إضافة الكود"}
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

/* ────────────────────────────────────────────────
   Generated results dialog
   ──────────────────────────────────────────────── */
function GeneratedCodesDialog({
  codes,
  onClose,
}: {
  codes: RechargeCodeRecord[];
  onClose: () => void;
}) {
  return (
    <AppDialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <AppDialogContent className="max-w-md">
        <AppDialogHeader>
          <AppDialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-warning" /> تم توليد {codes.length} كود
          </AppDialogTitle>
          <AppDialogDescription>
            انسخ الأكواد ووزعها على الطلاب
          </AppDialogDescription>
        </AppDialogHeader>

        <div className="max-h-[45vh] space-y-2 overflow-y-auto pe-1">
          {codes.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3"
            >
              <div>
                <div dir="ltr" className="text-end font-mono text-sm font-bold tracking-widest">
                  {formatRechargeCode(c.code)}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {formatCurrency(c.amount)} • {c.max_uses} استخدام
                </div>
              </div>
              <CopyCodeButton code={c.code} />
            </div>
          ))}
        </div>

        <AppDialogFooter>
          <AppButton onClick={onClose}>تم</AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

/* ────────────────────────────────────────────────
   Main page
   ──────────────────────────────────────────────── */
export default function RechargeCodesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [generateOpen, setGenerateOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RechargeCodeRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RechargeCodeRecord | null>(null);
  const [generatedCodes, setGeneratedCodes] = useState<RechargeCodeRecord[] | null>(null);

  const generate = useGenerateRechargeCodes();
  const remove = useDeleteRechargeCode();
  const toggle = useToggleRechargeCode();

  const { data, isLoading } = useRechargeCodesList({
    search: debouncedSearch || undefined,
    inactive: filter === "inactive" ? true : undefined,
    active_only: filter === "active" ? true : undefined,
    per_page: 20,
  });

  const items = data?.data ?? [];
  const totalValue = items.reduce((sum, c) => sum + Number(c.amount) * (c.max_uses - c.used_count), 0);
  const totalUsed = items.reduce((sum, c) => sum + c.used_count, 0);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    clearTimeout((handleSearchChange as any)._t);
    (handleSearchChange as any)._t = setTimeout(() => setDebouncedSearch(value.trim()), 400);
  };

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="أكواد الشحن"
        description="إدارة أكواد شحن محافظ الطلاب"
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <AppButton onClick={() => setGenerateOpen(true)}>
            <Sparkles className="h-4 w-4" /> توليد أكواد
          </AppButton>
          <AppButton variant="outline" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> إضافة كود يدوي
          </AppButton>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
            <AppInput
              className="w-56 ps-9"
              placeholder="بحث عن كود أو مبلغ..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {([
          { key: "all", label: "الكل" },
          { key: "active", label: "النشطة" },
          { key: "inactive", label: "غير النشطة" },
        ] as const).map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => { setFilter(f.key); setPage(1); }}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <AppDivider className="mb-6" />

      {isLoading ? (
        <AppLoadingState />
      ) : items.length === 0 ? (
        <AppEmptyState
          icon={TicketCheck}
          title="لا توجد أكواد شحن"
          description="ابدأ بتوليد أكواد شحن ليتسنى للطلاب شحن محافظهم."
          action={
            <AppButton onClick={() => setGenerateOpen(true)}>
              <Sparkles className="h-4 w-4" /> توليد كود
            </AppButton>
          }
        />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <AppCard className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Banknote className="h-4 w-4" /> القيمة المتبقية (هذه الصفحة)
              </div>
              <div className="mt-1 text-lg font-bold">{formatCurrency(totalValue)}</div>
            </AppCard>
            <AppCard className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Hash className="h-4 w-4" /> عدد الأكواد
              </div>
              <div className="mt-1 text-lg font-bold">{items.length}</div>
            </AppCard>
            <AppCard className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Power className="h-4 w-4" /> إجمالي الاستخدامات
              </div>
              <div className="mt-1 text-lg font-bold">{totalUsed}</div>
            </AppCard>
          </div>

          <AppCard className="overflow-hidden">
            <AppCardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b">
              <div className="space-y-1">
                <AppCardTitle>أكواد الشحن</AppCardTitle>
                <AppCardDescription>
                  {data?.total ?? 0} كود في المجمل
                </AppCardDescription>
              </div>
            </AppCardHeader>

            <div className="hidden grid-cols-[1.4fr_1fr_1.4fr_1fr_auto_auto] gap-4 border-b bg-muted/30 px-5 py-3 text-xs font-semibold text-muted-foreground lg:grid">
              <span>الكود</span>
              <span>المبلغ</span>
              <span>الاستخدامات</span>
              <span>تاريخ الانتهاء</span>
              <span>الحالة</span>
              <span className="text-end">الإجراءات</span>
            </div>

            <ul className="divide-y divide-border">
              {items.map((item) => {
                const status = codeStatus(item);
                const usedPct = Math.round((item.used_count / item.max_uses) * 100);
                return (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 px-5 py-3 transition-colors hover:bg-muted/40 lg:grid lg:grid-cols-[1.4fr_1fr_1.4fr_1fr_auto_auto] lg:items-center lg:gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        dir="ltr"
                        className="flex-1 text-end font-mono text-sm font-bold tracking-widest"
                      >
                        {formatRechargeCode(item.code)}
                      </div>
                      <CopyCodeButton code={item.code} />
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Banknote className="h-4 w-4 text-muted-foreground/50" />
                      {formatCurrency(item.amount)}
                    </div>

                    <div className="min-w-[120px]">
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>{item.used_count} من {item.max_uses}</span>
                        <span className="font-semibold">{usedPct}%</span>
                      </div>
                      <AppProgress
                        value={item.used_count}
                        max={item.max_uses}
                        variant={usedPct >= 100 ? "destructive" : usedPct >= 80 ? "warning" : "default"}
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarClock className="h-4 w-4 text-muted-foreground/50" />
                      {item.expires_at ? formatDateShort(item.expires_at) : "بدون انتهاء"}
                    </div>

                    <div className="flex items-center gap-2">
                      <AppStatusBadge status={status} label={status === "active" ? "متاح" : "متوقف"} />
                    </div>

                    <div className="flex justify-end">
                      <AppDropdownMenu>
                        <AppDropdownMenuTrigger asChild>
                          <AppButton variant="ghost" size="icon" title="خيارات" aria-label="خيارات">
                            <Pencil className="h-4 w-4" />
                          </AppButton>
                        </AppDropdownMenuTrigger>
                        <AppDropdownMenuContent align="end" className="w-48">
                          <AppDropdownMenuItem onSelect={() => { setEditing(item); setFormOpen(true); }}>
                            <Pencil className="me-2 h-4 w-4" /> تعديل
                          </AppDropdownMenuItem>
                          <AppDropdownMenuItem onSelect={() => toggle.mutate(item.id)}>
                            <Power className="me-2 h-4 w-4" />
                            {item.is_active ? "إيقاف الكود" : "تفعيل الكود"}
                          </AppDropdownMenuItem>
                          <AppDropdownMenuSeparator />
                          <AppDropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onSelect={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="me-2 h-4 w-4" /> حذف
                          </AppDropdownMenuItem>
                        </AppDropdownMenuContent>
                      </AppDropdownMenu>
                    </div>
                  </li>
                );
              })}
            </ul>
          </AppCard>

          {data && data.last_page > 1 && (
            <div className="mt-6">
              <AppPagination
                currentPage={data.current_page}
                lastPage={data.last_page}
                total={data.total}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      <GenerateCodesDialog
        open={generateOpen}
        onOpenChange={(v) => {
          setGenerateOpen(v);
          if (!v) setGeneratedCodes(null);
        }}
        onGenerated={setGeneratedCodes}
      />

      <CodeFormDialog
        key={formOpen ? (editing?.id ?? "new") : "closed"}
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
      />

      {generatedCodes && (
        <GeneratedCodesDialog codes={generatedCodes} onClose={() => setGeneratedCodes(null)} />
      )}

      <AppConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        title="حذف كود الشحن"
        description="هل أنت متأكد من حذف هذا الكود؟ لن يتمكن الطلاب من استخدامه بعد الآن."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        destructive
        onConfirm={() => {
          if (deleteTarget) remove.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </AppPage>
  );
}

function formatDateShort(value: string): string {
  try {
    return new Intl.DateTimeFormat("ar", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
  } catch {
    return value;
  }
}
