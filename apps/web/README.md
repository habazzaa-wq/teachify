# أكاديميتي — واجهة الأكاديمية (Web)

واجهة Tenant Admin Dashboard و Public Academy Frontend. مبنية بـ Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui. **العربية هي اللغة الأساسية والاتجاه RTL افتراضيًا عالميًا.**

> منصة Super Admin مبنية بـ Next.js ومُدارة هنا.


## قرارات المنصة (غير قابلة للتغيير)


## التشغيل

```bash
cp .env.local.example .env.local   # عدّل NEXT_PUBLIC_API_URL حسب الحاجة
npm install
npm run dev
```

افتح `http://localhost:3000`. الواجهة تُعيد التوجيه إلى `/login` ثم `/dashboard`.

### متطلبات API (Sanctum SPA)

- `NEXT_PUBLIC_API_URL` يشير إلى Laravel (مثل `http://localhost:8000`).
- يجب أن يكون نطاق الواجهة ضمن `SANCTUM_STATEFUL_DOMAINS` في الخادم (افتراضيًا `localhost:3000`).
- الكوكيز تُرسل مع `withCredentials: true`؛ ترويسة `X-Tenant-ID` تُحقن تلقائيًا.

npm run dev        # تشغيل التطوير
npm run build      # بناء الإنتاج
npm run start      # تشغيل البناء
npm run lint       # فحص ESLint
npm run typecheck  # فحص TypeScript
```

## بنية المجلدات

```text
src/
  app/                  App Router: layout + route groups ((auth), (dashboard))
  components/           ui/ (نظام التصميم App*) + layout/ + auth/ + ErrorBoundary
  features/             audit/, activity/, notifications/ (خدمات + hooks، بلا صفحات)
  hooks/                hooks عامة (useCan, usePermissions, useActiveTenant...)
  layouts/              DashboardLayout (يمين), PublicLayout, AuthLayout
  lib/                  cn, format, validation
  providers/            AppProviders + (Theme, Query, Tenant, Auth, Permission)
  services/             api/ (axios + services) + queryKeys/
  stores/               Zustand: auth, tenant, ui
  types/                أنواع TypeScript مطابقة لعقود API
  constants/            routes, navigation (صلاحيات + عناوين عربية)
  config/               env
  i18n/                 next-intl request config + messages/ar.json
```

## المزوّدات (Providers)

ترتيب `AppProviders`: `ThemeProvider → QueryProvider → TenantProvider → AuthProvider → PermissionProvider → Toaster`.

- **AuthProvider**: تمهيد الجلسة (`/me`)، تسجيل دخول/خروج، رد على 401.
- **TenantProvider**: tenant النشط من التخزين المحلي، يحقن `X-Tenant-ID`.
- **PermissionProvider**: تقييم الصلاحيات (`hasPermission`) — لا تستخدم أسماء الأدوار في الإظهار.
- **ThemeProvider**: فاتح/داكن، افتراضي فاتح، مع استمرار التفضيل.

## التفويض في الواجهة

- `useCan(permission)` و `<PermissionGuard permission="...">` هما الطريق الوحيد لإظهار/إخفاء العناصر.
- الشريط الجانبي يُرشّح عناصره حسب الصلاحيات في `constants/navigation.ts`.
- سجل التدقيق والنشاط **للقراءة فقط** ولا يُستخدمان أبدًا لقرارات التفويض.


---

## EN — Web (Academy Frontend)


See the Arabic section above for run instructions, folder architecture, provider order, API layer, and the permission-driven authorization model. The `X-Tenant-ID` header is injected globally by the axios instance — no component sets it manually.
