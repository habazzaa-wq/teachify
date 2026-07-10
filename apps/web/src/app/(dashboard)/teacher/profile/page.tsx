"use client";

import { AppPageHeader, AppWidget, AppAvatar, AppAvatarFallback, AppBadge, AppButton, AppInput, AppCard, AppCardContent, AppTabs, AppTabsList, AppTabsTrigger, AppTabsContent } from "@/components/ui";
import { useCurrentUser, useActiveTenant, useSubscription } from "@/hooks";
import { User, Mail, Calendar, Shield, Key, GraduationCap, Camera, Save } from "lucide-react";
import { initialsOf, formatDate } from "@/lib/format";

function ProfilePage() {
  const { user } = useCurrentUser();
  const { tenant } = useActiveTenant();
  const sub = useSubscription();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <AppPageHeader
        title="الملف الشخصي"
        description="إدارة معلوماتك الشخصية وإعدادات الحساب"
      />

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1">
          <AppWidget variant="default">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <AppAvatar className="h-24 w-24 ring-4 ring-border">
                  <AppAvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {initialsOf(user?.name)}
                  </AppAvatarFallback>
                </AppAvatar>
                <button className="absolute bottom-0 end-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <h2 className="text-lg font-bold">{user?.name}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="mt-3 flex items-center gap-2">
                <AppBadge variant="secondary">
                  <GraduationCap className="h-3 w-3" />
                  {tenant?.name}
                </AppBadge>
                <AppBadge variant="success" className="gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                  </span>
                  نشط
                </AppBadge>
              </div>
            </div>
          </AppWidget>
        </div>

        {/* Profile Content */}
        <div className="lg:col-span-3 space-y-6">
          <AppTabs defaultValue="profile">
            <AppTabsList>
              <AppTabsTrigger value="profile">
                <User className="h-4 w-4" />
                المعلومات الشخصية
              </AppTabsTrigger>
              <AppTabsTrigger value="security">
                <Shield className="h-4 w-4" />
                الأمان
              </AppTabsTrigger>
              <AppTabsTrigger value="api">
                <Key className="h-4 w-4" />
                مفاتيح API
              </AppTabsTrigger>
            </AppTabsList>

            <AppTabsContent value="profile" className="mt-6">
              <AppCard>
                <AppCardContent className="p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium mb-1 block">الاسم الكامل</label>
                      <AppInput defaultValue={user?.name ?? ""} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">البريد الإلكتروني</label>
                      <AppInput defaultValue={user?.email ?? ""} dir="ltr" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">رقم الهاتف</label>
                      <AppInput placeholder="أدخل رقم الهاتف" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">المنصب</label>
                      <AppInput placeholder="أدخل المنصب" />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <AppButton>
                      <Save className="h-4 w-4" />
                      حفظ التغييرات
                    </AppButton>
                  </div>
                </AppCardContent>
              </AppCard>
            </AppTabsContent>

            <AppTabsContent value="security" className="mt-6">
              <AppCard>
                <AppCardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">كلمة المرور الحالية</label>
                      <AppInput type="password" placeholder="••••••••" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium mb-1 block">كلمة المرور الجديدة</label>
                        <AppInput type="password" placeholder="أدخل كلمة المرور الجديدة" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">تأكيد كلمة المرور</label>
                        <AppInput type="password" placeholder="أعد إدخال كلمة المرور" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <AppButton>
                      <Shield className="h-4 w-4" />
                      تحديث كلمة المرور
                    </AppButton>
                  </div>
                </AppCardContent>
              </AppCard>
            </AppTabsContent>

            <AppTabsContent value="api" className="mt-6">
              <AppCard>
                <AppCardContent className="p-6 text-center">
                  <Key className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                  <p className="font-medium">لا توجد مفاتيح API</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    قم بإنشاء مفتاح API للتكامل مع التطبيقات الخارجية
                  </p>
                  <AppButton className="mt-4" size="sm">
                    <Key className="h-4 w-4" />
                    إنشاء مفتاح API
                  </AppButton>
                </AppCardContent>
              </AppCard>
            </AppTabsContent>
          </AppTabs>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
