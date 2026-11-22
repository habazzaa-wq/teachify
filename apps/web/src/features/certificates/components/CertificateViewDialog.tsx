"use client";

import { useRef } from "react";
import { X, Printer } from "lucide-react";
import type { IssuedCertificate } from "../types";
import { CertificatePreview } from "./CertificatePreview";

interface Props {
  certificate: IssuedCertificate | null;
  platformName?: string;
  platformLogoUrl?: string | null;
  onClose: () => void;
}

export function CertificateViewDialog({ certificate, platformName, platformLogoUrl, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  if (!certificate) return null;

  const handlePrint = () => {
    const node = ref.current?.querySelector(`#certificate-print-${certificate.id}`) as HTMLElement | null;
    if (!node) return window.print();
    const win = window.open("", "_blank", "width=1200,height=900");
    if (!win) return;
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join("\n");
    win.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><title>شهادة - ${certificate.certificate_number}</title>${styles}<style>@page{size:A4 landscape;margin:0}body{margin:0;background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact} .print-wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:0} .print-wrap > *{box-shadow:none!important;max-width:100%!important;width:1123px!important;aspect-ratio:1.414/1!important}</style></head><body><div class="print-wrap">${node.outerHTML}</div><script>window.onload=()=>{setTimeout(()=>{window.print();},300);};</script></body></html>`);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overflow-auto p-4" onClick={onClose}>
      <div className="mx-auto max-w-6xl my-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 text-white">
          <h3 className="text-lg font-bold">معاينة الشهادة</h3>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-bold hover:bg-white/25">
              <Printer className="h-4 w-4" /> طباعة
            </button>
            <button onClick={onClose} className="rounded-lg bg-white/15 p-2 hover:bg-white/25"><X className="h-5 w-5" /></button>
          </div>
        </div>
        <CertificatePreview ref={ref} certificate={certificate} platformName={platformName} platformLogoUrl={platformLogoUrl} />
      </div>
    </div>
  );
}
