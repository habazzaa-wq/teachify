"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { FileImage, FileText, Loader2, Printer, X } from "lucide-react";
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
  const [downloading, setDownloading] = useState<"png" | "pdf" | null>(null);

  if (!certificate) return null;

  const certificateNode = () => ref.current?.querySelector(`#certificate-print-${certificate.id}`) as HTMLElement | null;

  const renderCertificate = async () => {
    const node = certificateNode();
    if (!node) throw new Error("Certificate preview is not ready.");
    return html2canvas(node, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 8000,
      onclone: (documentClone) => {
        const cloned = documentClone.getElementById(`certificate-print-${certificate.id}`);
        if (cloned) {
          cloned.style.boxShadow = "none";
          cloned.style.maxWidth = "none";
          cloned.style.width = "1123px";
        }
      },
    });
  };

  const fileName = () => {
    const reference = certificate.reference_number ?? certificate.certificate_number ?? "certificate";
    return `certificate-${reference}`.replace(/[^a-zA-Z0-9-_]/g, "-");
  };

  const handleDownloadPng = async () => {
    setDownloading("png");
    try {
      const canvas = await renderCertificate();
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${fileName()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading("pdf");
    try {
      const canvas = await renderCertificate();
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 297, 210, undefined, "FAST");
      pdf.save(`${fileName()}.pdf`);
    } finally {
      setDownloading(null);
    }
  };

  const handlePrint = () => {
    const node = certificateNode();
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
    <div className="fixed inset-0 z-[100] bg-studio-overlay backdrop-blur-sm overflow-auto p-4" onClick={onClose}>
      <div className="mx-auto max-w-6xl my-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-studio-fg">
          <h3 className="text-lg font-bold">معاينة الشهادة</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadPng}
              disabled={downloading !== null}
              className="inline-flex items-center gap-2 rounded-lg bg-studio-glass-dialog px-4 py-2 text-sm font-bold hover:bg-studio-surface disabled:opacity-50"
            >
              {downloading === "png" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileImage className="h-4 w-4" />}
              صورة PNG
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading !== null}
              className="inline-flex items-center gap-2 rounded-lg bg-studio-glass-dialog px-4 py-2 text-sm font-bold hover:bg-studio-surface disabled:opacity-50"
            >
              {downloading === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              ملف PDF
            </button>
            <button
              onClick={handlePrint}
              disabled={downloading !== null}
              className="inline-flex items-center gap-2 rounded-lg bg-studio-glass-dialog px-4 py-2 text-sm font-bold hover:bg-studio-surface disabled:opacity-50"
            >
              <Printer className="h-4 w-4" /> طباعة
            </button>
            <button onClick={onClose} className="rounded-lg bg-studio-glass-dialog p-2 hover:bg-studio-surface" aria-label="إغلاق">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <CertificatePreview ref={ref} certificate={certificate} platformName={platformName} platformLogoUrl={platformLogoUrl} />
      </div>
    </div>
  );
}
