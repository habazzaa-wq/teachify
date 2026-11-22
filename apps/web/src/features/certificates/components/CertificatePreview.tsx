"use client";

import { forwardRef } from "react";
import { DEFAULT_CERTIFICATE_DESIGN, type CertificateTemplateDesign, type IssuedCertificate } from "../types";

export function resolveCertificateDesign(design?: Partial<CertificateTemplateDesign> | Record<string, unknown> | null): CertificateTemplateDesign {
  return { ...DEFAULT_CERTIFICATE_DESIGN, ...(design ?? {}) } as CertificateTemplateDesign;
}

interface Props {
  certificate: IssuedCertificate;
  platformName?: string;
  platformLogoUrl?: string | null;
}

export const CertificatePreview = forwardRef<HTMLDivElement, Props>(function CertificatePreview(
  { certificate, platformName, platformLogoUrl },
  ref,
) {
  const design = resolveCertificateDesign(certificate.template?.template_data);
  const logo = design.logoUrl || platformLogoUrl || null;
  const seal = design.sealUrl || null;
  const studentName = certificate.student?.user?.name ?? "طالب";
  const courseTitle = certificate.course?.title ?? "الدورة";
  const issuedDate = certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }) : "";
  const verificationCode = certificate.verification?.verification_code;
  const verificationUrl = verificationCode ? `${typeof window !== "undefined" ? window.location.origin : ""}/verify-certificate/${verificationCode}` : null;
  const borderStyle = design.borderStyle;
  const accent = design.accentColor || "#B8860B";
  const secondary = design.secondaryColor || "#1F2937";
  const bg = design.backgroundColor || "#FFFDF8";

  return (
    <div ref={ref} className="w-full overflow-auto bg-neutral-100 p-4 print:bg-white print:p-0">
      <div
        id={`certificate-print-${certificate.id}`}
        className="mx-auto relative shadow-2xl print:shadow-none"
        style={{
          width: "1123px",
          maxWidth: "100%",
          aspectRatio: "1.414/1",
          background: bg,
          color: secondary,
          fontFamily: design.fontFamily === "tajawal" ? "Tajawal, Cairo, sans-serif" : design.fontFamily === "noto" ? "'Noto Naskh Arabic', Cairo, serif" : "Cairo, sans-serif",
          overflow: "hidden",
        }}
      >
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at top right, ${accent}14, transparent 35%), radial-gradient(circle at bottom left, ${accent}10, transparent 30%)` }} />
        <div className="absolute inset-3 border-2" style={{ borderColor: `${accent}55` }} />
        <div className="absolute inset-6 border" style={{ borderColor: `${accent}33` }} />
        {borderStyle === "classic" && (
          <>
            <div className="absolute top-6 left-6 right-6 h-2" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
            <div className="absolute bottom-6 left-6 right-6 h-2" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
          </>
        )}
        {borderStyle === "modern" && (
          <div className="absolute top-0 left-0 right-0 h-24" style={{ background: `linear-gradient(135deg, ${accent}22, transparent)` }} />
        )}

        <div className="relative h-full flex flex-col justify-between px-16 py-14 text-center">
          <div className="flex items-start justify-between gap-4">
            <div className="w-28 h-28 flex items-center justify-center">
              {logo ? <img src={logo} alt="logo" className="max-h-28 max-w-28 object-contain" /> : <div className="h-20 w-20 rounded-full border-2 flex items-center justify-center text-xs font-bold" style={{ borderColor: accent, color: accent }}>{platformName?.slice(0, 2) || "شعار"}</div>}
            </div>
            <div className="flex-1 pt-2">
              <div className="text-sm tracking-[0.3em] font-bold" style={{ color: accent }}>{platformName || "المنصة التعليمية"}</div>
              <h1 className="mt-4 text-5xl font-black" style={{ color: secondary }}>{design.titleText || "شهادة إتمام"}</h1>
              <p className="mt-3 text-lg" style={{ color: `${secondary}cc` }}>{design.subtitleText || "تشهد هذه المنصة بأن"}</p>
            </div>
            <div className="w-28 h-28 flex items-center justify-center">
              {seal ? <img src={seal} alt="seal" className="max-h-28 max-w-28 object-contain" /> : (
                <div className="h-24 w-24 rounded-full border-4 flex items-center justify-center" style={{ borderColor: accent, color: accent }}>
                  <div className="h-18 w-18 rounded-full border-2 flex flex-col items-center justify-center text-[10px] font-black leading-tight px-2" style={{ borderColor: `${accent}88` }}>
                    <span>SEAL</span><span>ختم</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center py-8">
            <div className="text-4xl font-black mb-4" style={{ color: accent }}>{studentName}</div>
            <div className="mx-auto w-64 h-px mb-6" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
            <p className="text-xl mb-3" style={{ color: `${secondary}dd` }}>{design.bodyText || "قد أتم بنجاح متطلبات الدورة التدريبية"}</p>
            <p className="text-3xl font-extrabold" style={{ color: secondary }}>&ldquo;{courseTitle}&rdquo;</p>
            {certificate.completion?.completion_percent != null && (
              <p className="mt-4 text-sm font-bold" style={{ color: `${secondary}99` }}>نسبة الإنجاز: {certificate.completion.completion_percent}%</p>
            )}
          </div>

          <div className="flex items-end justify-between gap-8">
            <div className="text-right min-w-[180px]">
              <div className="h-px w-44 mb-2" style={{ backgroundColor: `${secondary}44` }} />
              <div className="font-bold">{design.signatureName || platformName || "إدارة المنصة"}</div>
              <div className="text-sm" style={{ color: `${secondary}99` }}>{design.signatureTitle || "مدير المنصة"}</div>
            </div>

            <div className="text-center text-sm" style={{ color: `${secondary}aa` }}>
              <div>{design.footerText || "نتمنى له دوام التوفيق والنجاح"}</div>
              <div className="mt-2 font-bold">تاريخ الإصدار: {issuedDate}</div>
              <div className="mt-1">رقم الشهادة: {certificate.certificate_number}</div>
              {verificationCode && <div className="mt-1">رمز التحقق: {verificationCode}</div>}
            </div>

            <div className="text-left min-w-[140px] flex flex-col items-end">
              {design.showQr && verificationUrl ? (
                <div className="border p-2 bg-white" style={{ borderColor: `${accent}44` }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(verificationUrl)}`}
                    alt="QR"
                    className="h-[90px] w-[90px]"
                  />
                </div>
              ) : <div className="h-[90px] w-[90px]" />}
              {verificationUrl && <div className="text-[10px] mt-1 max-w-[140px] break-all text-left" style={{ color: `${secondary}88` }}>تحقق من الشهادة</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
