"use client";

import { AppPageHeader, AppWidget, AppCard, AppCardContent, AppButton, AppInput, AppTabs, AppTabsList, AppTabsTrigger, AppTabsContent, AppEmptyState } from "@/components/ui";
import { HelpCircle, Search, BookOpen, MessageCircle, Mail, ExternalLink, FileText, Video, Users, LifeBuoy } from "lucide-react";
import Link from "next/link";

const helpCategories = [
  {
    title: "بدء الاستخدام",
    description: "دليل المبتدئين لإعداد المنصة",
    icon: BookOpen,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "فيديو تعليمي",
    description: "شروحات مصورة للميزات الأساسية",
    icon: Video,
    color: "bg-success/10 text-success",
  },
  {
    title: "الأسئلة الشائعة",
    description: "إجابات لأكثر الأسئلة تكراراً",
    icon: MessageCircle,
    color: "bg-info/10 text-info",
  },
  {
    title: "دليل المستخدم",
    description: "وثائق شاملة لجميع الميزات",
    icon: FileText,
    color: "bg-warning/10 text-warning",
  },
  {
    title: "مجتمع المستخدمين",
    description: "تواصل مع مستخدمين آخرين",
    icon: Users,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "الدعم الفني",
    description: "تواصل مع فريق الدعم المباشر",
    icon: LifeBuoy,
    color: "bg-destructive/10 text-destructive",
  },
];

function HelpPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <AppPageHeader
        title="المساعدة والدعم"
        description="ابحث عن إجابات لاستفساراتك أو تواصل مع فريق الدعم"
      />

      {/* Search */}
      <AppCard>
        <AppCardContent className="p-6">
          <div className="relative mx-auto max-w-xl">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <div className="relative">
              <AppInput
                placeholder="ابحث في مقالات المساعدة..."
                className="h-12 ps-11 text-base"
              />
            </div>
          </div>
        </AppCardContent>
      </AppCard>

      <AppTabs defaultValue="guides">
        <AppTabsList>
          <AppTabsTrigger value="guides">
            <BookOpen className="h-4 w-4" />
            أدلة المساعدة
          </AppTabsTrigger>
          <AppTabsTrigger value="contact">
            <Mail className="h-4 w-4" />
            تواصل معنا
          </AppTabsTrigger>
          <AppTabsTrigger value="faq">
            <MessageCircle className="h-4 w-4" />
            الأسئلة الشائعة
          </AppTabsTrigger>
        </AppTabsList>

        <AppTabsContent value="guides" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {helpCategories.map((category) => (
              <Link
                key={category.title}
                href="#"
                className="group rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-border hover:shadow-sm hover:-translate-y-0.5"
              >
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${category.color}`}>
                  <category.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">{category.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
              </Link>
            ))}
          </div>
        </AppTabsContent>

        <AppTabsContent value="contact" className="mt-6">
          <AppCard>
            <AppCardContent className="p-6">
              <div className="mx-auto max-w-lg text-center">
                <Mail className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                <h3 className="text-lg font-semibold">تواصل مع فريق الدعم</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  فريقنا متاح على مدار الساعة للرد على استفساراتك
                </p>
                <div className="mt-6 space-y-4 text-start">
                  <div>
                    <label className="text-sm font-medium mb-1 block">الموضوع</label>
                    <AppInput placeholder="ملخص الاستفسار" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">الرسالة</label>
                    <textarea
                      className="flex min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-1"
                      placeholder="اشرح مشكلتك بالتفصيل..."
                    />
                  </div>
                  <AppButton className="w-full">
                    <SendIcon />
                    إرسال
                  </AppButton>
                </div>
              </div>
            </AppCardContent>
          </AppCard>
        </AppTabsContent>

        <AppTabsContent value="faq" className="mt-6">
          <AppCard>
            <AppCardContent className="p-6">
              <AppEmptyState
                icon={MessageCircle}
                title="قسم الأسئلة الشائعة"
                description="سيتم إضافة الأسئلة الشائعة هنا قريباً"
              />
            </AppCardContent>
          </AppCard>
        </AppTabsContent>
      </AppTabs>
    </div>
  );
}

function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  );
}

export default HelpPage;
