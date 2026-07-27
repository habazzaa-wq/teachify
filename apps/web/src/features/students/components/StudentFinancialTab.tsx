"use client";

import { CreditCard, Receipt, Calendar, DollarSign, AlertCircle, Clock } from "lucide-react";
import { AppBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";

interface MockPayment {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  method: string;
}

const MOCK_PAYMENTS: MockPayment[] = [
  {
    id: "1",
    date: "2026-07-01T10:00:00Z",
    description: "اشتراك شهري - يوليو 2026",
    amount: 199.00,
    status: "paid",
    method: "بطاقة ائتمان",
  },
  {
    id: "2",
    date: "2026-06-01T10:00:00Z",
    description: "اشتراك شهري - يونيو 2026",
    amount: 199.00,
    status: "paid",
    method: "بطاقة ائتمان",
  },
  {
    id: "3",
    date: "2026-05-01T10:00:00Z",
    description: "اشتراك شهري - مايو 2026",
    amount: 199.00,
    status: "paid",
    method: "تحويل بنكي",
  },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  paid: { label: "مدفوع", color: "success" },
  pending: { label: "معلق", color: "warning" },
  overdue: { label: "متأخر", color: "destructive" },
};

function StudentFinancialTab() {
  const totalPaid = MOCK_PAYMENTS.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = MOCK_PAYMENTS.filter((p) => p.status === "pending" || p.status === "overdue").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">إجمالي المدفوعات</span>
          </div>
          <div className="text-2xl font-bold tabular-nums">{totalPaid.toFixed(2)} ر.س</div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">المبلغ المعلق</span>
          </div>
          <div className="text-2xl font-bold tabular-nums">{pendingAmount.toFixed(2)} ر.س</div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">إجمالي الفواتير</span>
          </div>
          <div className="text-2xl font-bold tabular-nums">{MOCK_PAYMENTS.length}</div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          سجل المدفوعات
        </h3>
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-start px-5 py-3 font-medium text-muted-foreground">التاريخ</th>
                  <th className="text-start px-5 py-3 font-medium text-muted-foreground">الوصف</th>
                  <th className="text-start px-5 py-3 font-medium text-muted-foreground">المبلغ</th>
                  <th className="text-start px-5 py-3 font-medium text-muted-foreground">الحالة</th>
                  <th className="text-start px-5 py-3 font-medium text-muted-foreground">طريقة الدفع</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_PAYMENTS.map((payment) => {
                  const statusCfg = STATUS_CONFIG[payment.status] ?? { label: "غير معروف", color: "secondary" };
                  return (
                    <tr key={payment.id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5 tabular-nums text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(payment.date)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium">{payment.description}</td>
                      <td className="px-5 py-3.5 tabular-nums font-semibold">{payment.amount.toFixed(2)} ر.س</td>
                      <td className="px-5 py-3.5">
                        <AppBadge
                          variant={statusCfg.color as "default" | "secondary" | "destructive" | "success" | "warning" | "outline"}
                          className="text-[10px]"
                        >
                          {statusCfg.label}
                        </AppBadge>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{payment.method}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-1">النظام المالي غير متاح حالياً</p>
        <p className="text-xs text-muted-foreground/70">
          سيتم ربط هذا القسم بنظام الفواتير والمدفوعات عند توفره.
        </p>
      </div>
    </div>
  );
}

export { StudentFinancialTab };
