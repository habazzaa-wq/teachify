import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getRequestOrigin, canonicalUrl } from "@/lib/seo/url";
import { SITE_NAME, CONTACT_EMAIL } from "@/features/marketing/data/content";

export async function generateMetadata(): Promise<Metadata> {
  const origin = await getRequestOrigin();
  const url = canonicalUrl(origin, "/marketing/privacy");

  return {
    title: "سياسة الخصوصية",
    description: "سياسة الخصوصية لمنصة تيتشيفاي وكيفية التعامل مع البيانات.",
    alternates: { canonical: url },
  };
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-extrabold" style={{ color: "hsl(var(--mk-ink))" }}>
        {title}
      </h2>
      <div className="mt-2.5 text-[0.9rem] leading-8" style={{ color: "hsl(var(--mk-ink-soft))" }}>
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[0.85rem] font-extrabold"
        style={{ color: "hsl(var(--mk-primary-deep))" }}
      >
        <ArrowRight size={15} />
        العودة إلى الرئيسية
      </Link>

      <header className="mt-8">
        <h1 className="mk-display mk-display-lg">سياسة الخصوصية</h1>
        <p className="mt-4 text-sm font-bold" style={{ color: "hsl(var(--mk-muted))" }}>
          آخر تحديث: أغسطس 2026 · {SITE_NAME}
        </p>
      </header>

      <div className="mt-4 h-px" style={{ background: "hsl(var(--mk-line))" }} />

      <Block title="نظرة عامة">
        <p>
          تيتشيفاي (وتُعرف أيضًا بـ«المنصة») توفّر بنية تحتية تقنية تُمكّن المعلمين
          والأكاديميات والمدارس من تشغيل منصاتهم التعليمية الخاصة بهويتهم. تشمل هذه السياسة
          كيفية تعاملنا مع البيانات على موقعنا الرسمي <span dir="ltr">teachify.tech</span>.
        </p>
      </Block>

      <Block title="البيانات التي نجمعها">
        <p>
          عند التواصل معنا أو طلب حجز منصة، قد نجمع بيانات التواصل التي تقدّمها طوعًا
          (كاسمك وبريدك الإلكتروني ورقم واتساب) بهدف الرد على استفسارك وتقديم الخدمة.
          قد نجمع أيضًا بيانات تقنية أساسية مثل نوع المتصفح والجهاز لتحسين تجربة الموقع.
        </p>
      </Block>

      <Block title="كيف نستخدم البيانات">
        <ul className="list-disc space-y-1.5 ps-5">
          <li>للرد على استفساراتك وتقديم العروض وبيئات التجربة.</li>
          <li>لتحسين أداء الموقع وتجربة المستخدم.</li>
          <li>للتواصل معك بخصوص التحديثات أو الخدمات التي طلبتها.</li>
        </ul>
      </Block>

      <Block title="مشاركة البيانات">
        <p>
          لا نبيع بياناتك الشخصية لأي طرف ثالث. قد نشارك البيانات الحدّ الأدنى مع مقدمي
          الخدمات التقنية (كالاستضافة والتحليلات) بموجب التزامات تعاقدية تحمي بياناتك، أو
          عند الاقتضاء القانوني.
        </p>
      </Block>

      <Block title="ملفات تعريف الارتباط">
        <p>
          نستخدم ملفات تعريف الارتباط والتقنيات المماثلة لتذكّر تفضيلاتك (مثل الوضع الليلي)
          وتحسين تجربة التصفح. يمكنك تعطيلها من إعدادات متصفحك، مع العلم أن بعض الوظائف قد
          تتأثر.
        </p>
      </Block>

      <Block title="بيانات منصات عملائنا">
        <p>
          بيانات الطلاب والمعلمين داخل منصات عملائنا تبقى ملكًا لأصحاب تلك المنصات وتخضع
          لسياساتهم الخاصة. نتولى معالجة هذه البيانات وتأمينها نيابةً عنهم وفق أفضل ممارسات
          الأمان، ولا نستخدمها لأغراض غير تشغيل الخدمة.
        </p>
      </Block>

      <Block title="حقوقك">
        <p>
          يحق لك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها في أي وقت. للتواصل بشأن أي
          استفسار خصوصية راسلنا على{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold underline" style={{ color: "hsl(var(--mk-primary-deep))" }}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Block>

      <Block title="التعديلات على هذه السياسة">
        <p>
          قد نحدّث هذه السياسة من وقت لآخر، وسيُنشر أي تعديل في هذه الصفحة مع تحديث تاريخ
          «آخر تحديث». استمرارك في استخدام الموقع بعد التعديل يعني موافقتك على السياسة
          المحدّثة.
        </p>
      </Block>
    </article>
  );
}
