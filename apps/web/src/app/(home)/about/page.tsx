import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  Clock3,
  Compass,
  Hammer,
  Heart,
  Lightbulb,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Quote as QuoteIcon,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import styles from "@/features/about/about-page.module.css";
import { aboutServerService } from "@/features/about/server-service";
import {
  buildDirectionsUrl,
  buildMapsEmbedUrl,
  buildWhatsAppUrl,
  type AboutIconName,
  type AboutSettings,
} from "@/features/about/types";
import { toAbsoluteAssetUrl } from "@/lib/url";
import { buildSeoMetadata, getSiteName } from "@/lib/seo/metadata";
import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import { canonicalUrl, getRequestOrigin } from "@/lib/seo/url";

export const dynamic = "force-dynamic";

const ICONS: Record<AboutIconName, React.ElementType> = {
  book: BookOpen,
  hammer: Hammer,
  trending: TrendingUp,
  compass: Compass,
  target: Target,
  sparkles: Sparkles,
  heart: Heart,
  award: Award,
  chart: BarChart3,
  users: Users,
  lightbulb: Lightbulb,
  shield: ShieldCheck,
};

function SmartLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const external = /^(https?:|mailto:|tel:)/i.test(href.trim());
  if (external) {
    const isHttp = /^https?:/i.test(href.trim());
    return (
      <a
        href={href}
        className={className}
        {...(isHttp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href || "#"} className={className}>
      {children}
    </Link>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  index,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  index?: string;
}) {
  if (!eyebrow && !title && !description) return null;
  return (
    <div className={styles.sectionHead}>
      <div>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        {title && <h2 className={styles.sectionTitle}>{title}</h2>}
        {description && <p className={styles.sectionDesc}>{description}</p>}
      </div>
      {index && <span className={styles.sectionIndex}>{index}</span>}
    </div>
  );
}

function Hero({ data }: { data: AboutSettings }) {
  const image = toAbsoluteAssetUrl(data.hero.image);
  const subtitle = data.story.points[0]?.title || "تعلّم";

  return (
    <section className={styles.hero} aria-labelledby="about-hero-title">
      <span className={styles.heroPattern} aria-hidden="true" />
      <div className={styles.heroCopy}>
        {data.hero.eyebrow && <span className={styles.eyebrow}>{data.hero.eyebrow}</span>}
        <h1 id="about-hero-title" className={styles.heroTitle}>
          {data.hero.title}
        </h1>
        {data.hero.description && <p className={styles.heroDesc}>{data.hero.description}</p>}

        <div className={styles.heroActions}>
          {data.hero.primaryLabel && (
            <SmartLink href={data.hero.primaryHref} className={styles.btnPrimary}>
              {data.hero.primaryLabel}
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </SmartLink>
          )}
          {data.hero.secondaryLabel && (
            <SmartLink href={data.hero.secondaryHref} className={styles.btnOutline}>
              {data.hero.secondaryLabel}
            </SmartLink>
          )}
        </div>
      </div>

      <div className={styles.heroStage} aria-hidden={!image}>
        <div className={styles.deck}>
          <div className={styles.heroCardBack} />
          <div className={styles.heroCardMid} />
          <div className={styles.heroCardFront}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={data.hero.title} className={styles.heroCardImage} />
            ) : (
              <div className={styles.heroCardArt}>
                <span className={styles.heroArtRing}>
                  <Sparkles className="h-10 w-10" strokeWidth={1.4} />
                </span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>مساحة للتعلّم</span>
              </div>
            )}
            <div className={styles.heroCardBody}>
              <div>
                <div className={styles.heroCardTitle}>{subtitle}</div>
                <div className={styles.heroCardSubtitle}>خطوة بخطوة، حتى تصل</div>
              </div>
              <span className={styles.heroSeal}>
                <Target className="h-5 w-5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats({ items }: { items: AboutSettings["stats"] }) {
  if (items.length === 0) return null;
  return (
    <div className={styles.stats} aria-label="أرقام سريعة">
      {items.map((item) => (
        <div key={item.id} className={styles.stat}>
          <div className={styles.statValue}>{item.value}</div>
          <div className={styles.statLabel}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function Story({ data }: { data: AboutSettings }) {
  const { story } = data;
  if (!story.title && story.paragraphs.length === 0 && story.points.length === 0) return null;

  return (
    <section id="about-story" className={styles.section} aria-labelledby="about-story-title">
      <SectionHeader eyebrow={story.eyebrow} index="01 / قصتنا" />
      <div className={styles.storyGrid}>
        <div className={styles.storyText}>
          {story.title && (
            <h2 id="about-story-title" className={styles.storyTitle}>
              {story.title}
            </h2>
          )}
          {story.paragraphs.map((paragraph, index) => (
            <p key={`${index}-${paragraph.slice(0, 12)}`} className={styles.storyParagraph}>
              {paragraph}
            </p>
          ))}
        </div>

        {story.points.length > 0 && (
          <div className={styles.storyPoints}>
            {story.points.map((point) => {
              const Icon = ICONS[point.icon] ?? Sparkles;
              return (
                <div key={point.id} className={styles.pointCard}>
                  <span className={styles.pointIcon}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <div className={styles.pointTitle}>{point.title}</div>
                    <div className={styles.pointDesc}>{point.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function Journey({ data }: { data: AboutSettings }) {
  const { journey } = data;
  if (journey.steps.length === 0) return null;

  return (
    <section id="about-journey" className={styles.section} aria-labelledby="about-journey-title">
      <SectionHeader
        eyebrow={journey.eyebrow}
        title={journey.title}
        description={journey.description}
        index="02 / رحلتنا"
      />
      <h2 id="about-journey-title" className="sr-only">
        {journey.title || "رحلتنا"}
      </h2>
      <div className={styles.journeyGrid}>
        {journey.steps.map((step) => {
          const Icon = ICONS[step.icon] ?? Sparkles;
          return (
            <article key={step.id} className={styles.stepCard}>
              <span className={styles.stepNumber}>{step.number}</span>
              <span className={styles.stepIcon}>
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Values({ data }: { data: AboutSettings }) {
  const { values } = data;
  if (values.items.length === 0) return null;

  return (
    <section id="about-values" className={styles.section} aria-labelledby="about-values-title">
      <SectionHeader
        eyebrow={values.eyebrow}
        title={values.title}
        description={values.description}
        index="03 / قيمنا"
      />
      <h2 id="about-values-title" className="sr-only">
        {values.title || "قيمنا"}
      </h2>
      <div className={styles.valuesGrid}>
        {values.items.map((item) => {
          const Icon = ICONS[item.icon] ?? Sparkles;
          return (
            <article key={item.id} className={styles.valueCard}>
              <span className={styles.valueIcon}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className={styles.valueTitle}>{item.title}</h3>
              <p className={styles.valueDesc}>{item.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Quote({ data }: { data: AboutSettings }) {
  if (!data.quote.text) return null;
  return (
    <section className={styles.section} aria-label="اقتباس">
      <div className={styles.quoteCard}>
        <QuoteIcon className="h-9 w-9 flex-shrink-0 opacity-60" aria-hidden="true" />
        <span className={styles.quoteMark} aria-hidden="true">
          ”
        </span>
        <p className={styles.quoteText}>{data.quote.text}</p>
        <div className={styles.quoteMeta}>
          <div className={styles.quoteAuthor}>{data.quote.author}</div>
          {data.quote.role && <div className={styles.quoteRole}>{data.quote.role}</div>}
        </div>
      </div>
    </section>
  );
}

function Location({ data }: { data: AboutSettings }) {
  const { location } = data;
  const mapSrc = buildMapsEmbedUrl(location);
  const directions = buildDirectionsUrl(location);
  const whatsapp = buildWhatsAppUrl(location.whatsapp);
  const phoneHref = location.phone.trim() ? `tel:${location.phone.replace(/\s/g, "")}` : "";

  return (
    <section id="about-location" className={styles.section} aria-labelledby="about-location-title">
      <SectionHeader eyebrow={location.eyebrow} index="04 / تواصل معنا" />
      <div className={styles.locationGrid}>
        <div className={styles.contactCard}>
          {location.title && (
            <h2 id="about-location-title" className={styles.contactTitle}>
              {location.title}
            </h2>
          )}
          {location.description && <p className={styles.contactDesc}>{location.description}</p>}

          <div className={styles.contactRows}>
            {location.address && (
              <div className={styles.contactRow}>
                <span className={styles.contactIcon}>
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className={styles.contactLabel}>العنوان</span>
                  <span className={styles.contactValue}>{location.address}</span>
                </span>
              </div>
            )}
            {phoneHref && (
              <div className={styles.contactRow}>
                <span className={styles.contactIcon}>
                  <Phone className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className={styles.contactLabel}>اتصل بنا</span>
                  <a href={phoneHref} className={styles.contactValue} dir="ltr">
                    {location.phone}
                  </a>
                </span>
              </div>
            )}
            {location.email && (
              <div className={styles.contactRow}>
                <span className={styles.contactIcon}>
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className={styles.contactLabel}>راسلنا</span>
                  <a href={`mailto:${location.email}`} className={styles.contactValue} dir="ltr">
                    {location.email}
                  </a>
                </span>
              </div>
            )}
            {location.hours && (
              <div className={styles.contactRow}>
                <span className={styles.contactIcon}>
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className={styles.contactLabel}>ساعات العمل</span>
                  <span className={styles.contactValue}>{location.hours}</span>
                </span>
              </div>
            )}
            {whatsapp && (
              <div className={styles.contactRow}>
                <span className={styles.contactIcon}>
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className={styles.contactLabel}>واتساب</span>
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.contactValue}
                    dir="ltr"
                  >
                    {location.whatsapp}
                  </a>
                </span>
              </div>
            )}
          </div>

          <a
            href={directions}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.directions}
          >
            <Navigation className="h-4 w-4" aria-hidden="true" />
            افتح الموقع على خرائط جوجل
          </a>
        </div>

        <div className={styles.mapShell}>
          <span className={styles.mapBadge}>
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {location.address || "موقعنا"}
          </span>
          <iframe
            className={styles.mapIframe}
            src={mapSrc}
            title={location.title ? `خريطة ${location.title}` : "موقعنا على خرائط جوجل"}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}

function FinalCta({ data }: { data: AboutSettings }) {
  const { cta } = data;
  if (!cta.title && !cta.buttonLabel) return null;
  return (
    <section className={styles.section} aria-labelledby="about-cta-title">
      <div className={styles.ctaCard}>
        {cta.eyebrow && <span className={styles.eyebrow}>{cta.eyebrow}</span>}
        {cta.title && (
          <h2 id="about-cta-title" className={styles.ctaTitle}>
            {cta.title}
          </h2>
        )}
        {cta.description && <p className={styles.ctaDesc}>{cta.description}</p>}
        {cta.buttonLabel && (
          <SmartLink href={cta.buttonHref} className={styles.ctaButton}>
            {cta.buttonLabel}
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </SmartLink>
        )}
      </div>
    </section>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const [tenant, origin, about] = await Promise.all([
    getTenantSeoContext(),
    getRequestOrigin(),
    aboutServerService.getPublicAbout(),
  ]);

  return buildSeoMetadata(
    {
      title: { absolute: `من نحن — ${getSiteName(tenant)}` },
      description: about.hero.description,
      canonical: canonicalUrl(origin, "/about"),
      ogImage: toAbsoluteAssetUrl(about.hero.image),
      ogImageAlt: about.hero.title,
    },
    tenant,
    origin,
  );
}

async function AboutPage() {
  const about = await aboutServerService.getPublicAbout();

  return (
    <div dir="rtl" className={styles.page}>
      <div className={styles.container}>
        <Hero data={about} />
        <div className={styles.section}>
          <Stats items={about.stats} />
        </div>
        <Story data={about} />
        <Journey data={about} />
        <Values data={about} />
        <Quote data={about} />
        <Location data={about} />
        <FinalCta data={about} />
      </div>
    </div>
  );
}

export default AboutPage;
