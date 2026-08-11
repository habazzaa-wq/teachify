import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getRequestOrigin, canonicalUrl } from "@/lib/seo/url";
import { SITE_NAME, CONTACT_EMAIL } from "@/features/marketing/data/content";

export async function generateMetadata(): Promise<Metadata> {
  const origin = await getRequestOrigin();
  const url = canonicalUrl(origin, "/marketing/terms");

  return {
    title: "شروط الاستخدام",
    description: "شروط استخدام موقع تيتشيفاي وخدمات المنصات التعليمية.",
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

export default function TermsPage() {
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
        <h1 className="mk-display mk-display-lg">شروط الاستخدام</h1>
        <p className="mt-4 text-sm font-bold" style={{ color: "hsl(var(--mk-muted))" }}>
          آخر تحديث: أغسطس 2026 · {SITE_NAME}
        </p>
      </header>

      <div className="mt-4 h-px" style={{ background: "hsl(var(--mk-line))" }} />

      <Block title="قبول الشروط">
        <p>
          باستخدامك لموقع <span dir="ltr">teachify.tech</span> أو أي من خدمات تيتشيفاي، فأنت
          توافق على هذه الشروط. إذا كنت لا توافق عليها، يرجى عدم استخدام الخدمة.
        </p>
      </Block>

      <Block title="وصف الخدمة">
        <p>
          توفّر تيتشيفاي بنية تحتية تقنية لتشغيل منصات تعليمية مستقلة بهوية العملاء (المعلمين،
          الأكاديميات، المدارس، ومراكز التدريب)، تشمل إدارة الكورسات والطلاب والامتحانات
          والمدفوعات والشهادات والمجتمع.
        </p>
      </Block>

      <Block title="ملكية المحتوى">
        <p>
          محتوى المنصات التي تشغّلها تيتشيفاي (كورسات، دروس، مواد، وشهادات) ملك لأصحاب تلك
          المنصات. البنية التقنية والبرمجيات والعلامة التجارية «تيتشيفاي» ملكية حصرية لنا.
        </p>
      </Block>

      <Block title="التزاماتك">
        <ul className="list-disc space-y-1.5 ps-5">
          <li>أن تكون بياناتك ومحتواك منشورًا بحقّ قانوني، وألا تخالف القوانين أو حقوق الغير.</li>
          <li>عدم استخدام الخدمة في أي نشاط غير قانوني أو مضلل أو مسيء.</li>
          <li>عدم محاولة اختراق النظام أو الوصول إلى بيانات لا تخصك.</li>
          <li>إبقاء بيانات الدخول سرّية وتحت مسؤوليتك.</li>
        </ul>
      </Block>

      <Block title="الاشتراك والمدفوعات">
        <p>
          تُتفق رسوم تشغيل المنصات ومدة الاشتراك وشروط التجديد في اتفاق خاص مع كل عميل.
          البيئات التجريبية تُقدَّم مجانًا بغرض التقييم ولا تعتبر التزامًا بالاشتراك.
        </p>
      </Block>

      <Block title="الخصوصية">
        <p>
          بياناتك تخضع لسياسة الخصوصية المنشورة على موقعنا، وتعتبر جزءًا لا يتجزأ من هذه
          الشروط. نحن نلتزم بحماية بياناتك وبيانات طلابك.
        </p>
      </Block>

      <Block title="إخلاء المسؤولية وحدودها">
        <p>
          نقدّم الخدمة «كما هي» ضمن معايير جودة معقولة، ولا نضمن خلّوها من أخطاء عابرة.
          لا تتحمل تيتشيفاي مسؤولية الأضرار غير المباشرة الناشئة عن استخدام المنصات أو توقفها
          المؤقت، فيما تبقى مسؤوليتنا في الحدود المسموح بها قانونًا.
        </p>
      </Block>

      <Block title="قانون خاضع له وتواصل">
        <p>
          تخضع هذه الشروط للقوانين السارية في المملكة العربية السعودية. لأي استفسار أو نزاع،
          تواصل معنا على{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold underline" style={{ color: "hsl(var(--mk-primary-deep))" }}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Block>
    </article>
  );
}
