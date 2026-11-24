"use client";

import { forwardRef, useEffect, useState } from "react";
import QRCode from "qrcode";
import { DEFAULT_CERTIFICATE_DESIGN, type CertificateTemplateDesign, type IssuedCertificate } from "../types";

export function resolveCertificateDesign(design?: Partial<CertificateTemplateDesign> | Record<string, unknown> | null): CertificateTemplateDesign {
  return { ...DEFAULT_CERTIFICATE_DESIGN, ...(design ?? {}) } as CertificateTemplateDesign;
}

interface Props {
  certificate: IssuedCertificate;
  platformName?: string;
  platformLogoUrl?: string | null;
}

function OrnamentDivider({ accent }: { accent: string }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${accent}aa)` }} />
      <div className="h-2.5 w-2.5 rotate-45 border-2" style={{ borderColor: accent }} />
      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${accent}aa, transparent)` }} />
    </div>
  );
}

function SignatureBlock({
  imageUrl,
  name,
  title,
  accent,
  secondary,
  align = "center",
}: {
  imageUrl: string | null;
  name: string;
  title: string;
  accent: string;
  secondary: string;
  align?: "center" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-center"}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name}
          className={`mb-1 h-14 max-w-[190px] object-contain ${align === "right" ? "object-right" : "mx-auto"}`}
        />
      ) : (
        <div className="h-14" />
      )}
      <div
        className="mb-2 h-px w-44"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
      <div className="text-sm font-black">{name}</div>
      <div className="mt-0.5 text-[11px] font-bold" style={{ color: `${secondary}99` }}>
        {title}
      </div>
    </div>
  );
}

export const CertificatePreview = forwardRef<HTMLDivElement, Props>(function CertificatePreview(
  { certificate, platformName, platformLogoUrl },
  ref,
) {
  const snapshot = certificate.snapshot_data ?? {};
  const design = resolveCertificateDesign(snapshot.design ?? certificate.template?.template_data);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const logo = design.logoUrl || platformLogoUrl || null;
  const seal = design.sealUrl || null;
  const studentName = snapshot.student_name ?? certificate.student?.user?.name ?? "طالب";
  const courseTitle = snapshot.course_title ?? certificate.course?.title ?? "الدورة";
  const instructorName = snapshot.instructor_name ?? "اسم المدرب";
  const referenceNumber = snapshot.reference_number ?? certificate.reference_number ?? certificate.certificate_number;
  const issuedDateValue = snapshot.issued_at ?? certificate.issued_at;
  const issuedDate = issuedDateValue
    ? new Date(issuedDateValue).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })
    : "";
  const verificationCode = snapshot.verification_code ?? certificate.verification?.verification_code;
  const verificationUrl = verificationCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/verify-certificate/${verificationCode}`
    : null;
  const showInstructorSignature = Boolean(snapshot.show_instructor_signature ?? certificate.show_instructor_signature ?? false);
  const managerSignatureUrl = snapshot.manager_signature_url ?? design.signatureImageUrl;
  const managerSignatureName = snapshot.manager_signature_name ?? design.signatureName ?? platformName ?? "إدارة المنصة";
  const managerSignatureTitle = snapshot.manager_signature_title ?? design.signatureTitle ?? "مدير المنصة";
  const instructorSignatureUrl = snapshot.instructor_signature_url ?? design.instructorSignatureUrl;
  const borderStyle = design.borderStyle;
  const accent = design.accentColor || "#B8860B";
  const secondary = design.secondaryColor || "#1F2937";
  const bg = design.backgroundColor || "#FFFDF8";

  const shouldRenderQr = Boolean(verificationUrl && design.showQr);

  useEffect(() => {
    let cancelled = false;
    if (!shouldRenderQr || !verificationUrl) return;
    void QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 240,
      color: { dark: secondary, light: "#FFFFFF" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [verificationUrl, shouldRenderQr, secondary]);

  return (
    <div ref={ref} className="w-full overflow-auto bg-studio-muted p-4 print:bg-white print:p-0">
      <div
        id={`certificate-print-${certificate.id}`}
        dir="rtl"
        className="relative mx-auto shadow-[0_24px_70px_rgba(15,23,42,0.28)] print:shadow-none"
        style={{
          width: "1123px",
          maxWidth: "100%",
          aspectRatio: "1.414/1",
          background: bg,
          color: secondary,
          fontFamily:
            design.fontFamily === "tajawal"
              ? "Tajawal, Cairo, sans-serif"
              : design.fontFamily === "noto"
                ? "'Noto Naskh Arabic', Cairo, serif"
                : "Cairo, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Paper texture and soft corner glows */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 12% 12%, ${accent}18, transparent 32%),
              radial-gradient(circle at 88% 88%, ${accent}14, transparent 34%),
              repeating-linear-gradient(45deg, ${accent}06 0 1px, transparent 1px 14px)
            `,
          }}
        />

        {/* Faint watermark */}
        <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center overflow-hidden">
          <div
            className="whitespace-nowrap font-black"
            style={{
              fontSize: "190px",
              color: accent,
              opacity: 0.045,
              transform: "rotate(-14deg)",
              letterSpacing: "-8px",
            }}
          >
            {platformName || "CERTIFIED"}
          </div>
        </div>

        {/* Frame */}
        {borderStyle !== "minimal" && (
          <>
            <div className="absolute inset-[14px] border-2" style={{ borderColor: `${accent}70` }} />
            <div className="absolute inset-[23px] border" style={{ borderColor: `${accent}38` }} />
            {borderStyle === "classic" && (
              <>
                <div
                  className="absolute inset-x-[23px] top-[23px] h-[6px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${accent}aa, transparent)` }}
                />
                <div
                  className="absolute inset-x-[23px] bottom-[23px] h-[6px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${accent}aa, transparent)` }}
                />
                {[
                  "top-[8px] right-[8px]",
                  "top-[8px] left-[8px]",
                  "bottom-[8px] right-[8px]",
                  "bottom-[8px] left-[8px]",
                ].map((position) => (
                  <div
                    key={position}
                    className={`absolute h-3.5 w-3.5 rotate-45 border-2 ${position}`}
                    style={{ borderColor: accent, background: bg }}
                  />
                ))}
              </>
            )}
            {borderStyle === "modern" && (
              <div className="absolute right-[14px] top-[14px] h-28 w-2" style={{ background: accent }} />
            )}
          </>
        )}
        {borderStyle === "minimal" && (
          <div className="absolute inset-[18px] border" style={{ borderColor: `${accent}55` }} />
        )}

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col px-[68px] py-[48px]">
          {/* Header */}
          <header className="flex items-start justify-between gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="logo" className="max-h-24 max-w-24 object-contain" />
              ) : (
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full border-2 text-xs font-black"
                  style={{ borderColor: accent, color: accent }}
                >
                  {platformName?.slice(0, 2) || "شعار"}
                </div>
              )}
            </div>

            <div className="flex-1 pt-1 text-center">
              <div className="text-[11px] font-black tracking-[0.42em]" style={{ color: accent }}>
                {platformName || "المنصة التعليمية"}
              </div>
              <h1 className="mt-3 text-[46px] font-black leading-tight" style={{ color: secondary }}>
                {design.titleText || "شهادة إتمام الدورة"}
              </h1>
              <div className="mt-2 text-[13px] font-bold" style={{ color: `${secondary}88` }}>
                {certificate.certificate_number}
              </div>
            </div>

            <div className="flex h-24 w-24 shrink-0 items-center justify-center">
              {seal ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={seal} alt="seal" className="max-h-24 max-w-24 object-contain" />
              ) : (
                <div
                  className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-[3px] text-center"
                  style={{ borderColor: accent, color: accent }}
                >
                  <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full border text-[10px] font-black leading-tight" style={{ borderColor: `${accent}88` }}>
                    <span>ختم</span>
                    <span>المنصة</span>
                  </div>
                </div>
              )}
            </div>
          </header>

          <OrnamentDivider accent={accent} />

          {/* Main body */}
          <main className="flex flex-1 flex-col items-center justify-center py-3 text-center">
            <p className="text-lg font-bold" style={{ color: `${secondary}cc` }}>
              {design.subtitleText || "تشهد هذه المنصة بأن"}
            </p>

            <div className="relative mt-3">
              <div className="px-10 text-[44px] font-black leading-tight" style={{ color: accent }}>
                {studentName}
              </div>
              <div className="mx-auto mt-2 h-px w-[420px]" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
            </div>

            <p className="mt-5 text-base font-bold" style={{ color: `${secondary}bb` }}>
              {design.bodyText || "قد أتم بنجاح متطلبات الدورة التدريبية"}
            </p>

            <div
              className="relative mt-4 max-w-[780px] px-14 py-4"
              style={{
                borderTop: `1px solid ${accent}77`,
                borderBottom: `1px solid ${accent}77`,
              }}
            >
              <span className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45" style={{ background: accent }} />
              <span className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45" style={{ background: accent }} />
              <div className="text-[30px] font-black leading-snug" style={{ color: secondary }}>
                &ldquo;{courseTitle}&rdquo;
              </div>
            </div>

            <p className="mt-5 text-sm font-bold" style={{ color: `${secondary}99` }}>
              المدرب: <span style={{ color: secondary }}>{instructorName}</span>
            </p>
          </main>

          <OrnamentDivider accent={accent} />

          {/* Footer */}
          <footer className="grid grid-cols-3 items-end gap-6 pt-2">
            <SignatureBlock
              imageUrl={managerSignatureUrl ?? null}
              name={managerSignatureName}
              title={managerSignatureTitle}
              accent={accent}
              secondary={secondary}
              align="right"
            />

            <div className="text-center text-[11px] font-bold leading-relaxed" style={{ color: `${secondary}99` }}>
              <div className="text-xs font-black" style={{ color: secondary }}>
                {design.footerText || "نتمنى له دوام التوفيق والنجاح"}
              </div>
              <div className="mt-2">تاريخ الإصدار: {issuedDate}</div>
              <div>الرقم المرجعي: {referenceNumber}</div>
              {verificationCode && <div className="mt-0.5 text-[10px]">رمز التحقق: {verificationCode}</div>}
            </div>

            <div className="flex items-end justify-end gap-4">
              {showInstructorSignature && (
                <SignatureBlock
                  imageUrl={instructorSignatureUrl ?? null}
                  name={instructorName}
                  title="مدرب الدورة"
                  accent={accent}
                  secondary={secondary}
                />
              )}

              <div className="flex flex-col items-center">
                {shouldRenderQr && verificationUrl ? (
                  <div className="border bg-white p-2" style={{ borderColor: `${accent}55` }}>
                    {qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrDataUrl} alt="QR" className="h-[96px] w-[96px]" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verificationUrl)}`}
                        alt="QR"
                        className="h-[96px] w-[96px]"
                      />
                    )}
                  </div>
                ) : (
                  <div className="h-[112px] w-[112px]" />
                )}
                {verificationUrl && (
                  <div className="mt-1 max-w-[130px] text-[10px] font-bold" style={{ color: `${secondary}88` }}>
                    امسح للتحقق من الشهادة
                  </div>
                )}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
});
