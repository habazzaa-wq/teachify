"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Facebook,
  Youtube,
  Phone,
  PhoneCall,
  Star,
  Award,
  Clock,
  MessageCircle,
  Gift,
} from "lucide-react";
import { usePublicHero } from "@/features/homepage/hero/hooks";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const primary = "#D87B63";
const secondary = "#FFB50E";

export function HeroSection() {
  const { data: hero } = usePublicHero();
  const { tenant } = useActiveTenant();
  const theme = useUiStore((s) => s.theme);
  const [phoneHovered, setPhoneHovered] = useState(false);
  const tenantName = tenant?.name ?? "";
  const isDark = theme === "dark";

  if (!hero?.isActive && hero !== undefined) return null;

  const title = hero?.title || `مرحباً بكم في ${tenantName}`;
  const social = hero?.socialLinks;
  const icons = hero?.icons;
  const teacherImage = hero?.teacherImage;
  const teacherName = hero?.teacherName || "المعلم";

  const lightBg =
    "radial-gradient(ellipse at 50% 30%, #FAF8F5 0%, #F7F4EF 40%, #F3EFE8 80%, #EFEAE1 100%)";
  const darkBg =
    "radial-gradient(ellipse at 50% 30%, #121418 0%, #14161a 40%, #16181d 80%, #181a1f 100%)";

  return (
    <section
      className="hero-section relative w-full overflow-hidden"
      dir="rtl"
      style={{ minHeight: 560 }}
    >
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{ background: isDark ? darkBg : lightBg }}
      />
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{
          background: isDark
            ? "radial-gradient(circle at 30% 70%, rgba(216,123,99,0.03) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(255,181,14,0.02) 0%, transparent 50%)"
            : "radial-gradient(circle at 30% 70%, rgba(216,123,99,0.03) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(255,181,14,0.03) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto flex flex-col items-center px-4 pt-4 pb-6 sm:pt-0 sm:pb-10">
        {hero?.badge2Text && (
          <div className="absolute top-2 start-2 z-20 sm:top-4 sm:start-4 lg:top-5 lg:start-6">
            <div
              className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-[11px] font-bold shadow-lg sm:px-4 sm:py-2.5 sm:text-xs ${
                isDark
                  ? "border-white/10 bg-white/10 text-white"
                  : "border-white/50 bg-white/80"
              }`}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl sm:h-8 sm:w-8"
                style={{
                  background: `linear-gradient(135deg, ${secondary}, ${secondary}cc)`,
                }}
              >
                <Clock className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />
              </div>
              <span style={{ color: secondary }}>{hero.badge2Text}</span>
            </div>
          </div>
        )}

        {hero?.badge1Text && (
          <div className="absolute bottom-2 end-2 z-20 sm:bottom-4 sm:end-4 lg:bottom-5 lg:end-6">
            <div
              className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-[11px] font-bold shadow-lg sm:px-4 sm:py-2.5 sm:text-xs ${
                isDark
                  ? "border-white/10 bg-white/10 text-white"
                  : "border-white/50 bg-white/80"
              }`}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl sm:h-8 sm:w-8"
                style={{
                  background: `linear-gradient(135deg, ${primary}, ${primary}cc)`,
                }}
              >
                <Award className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />
              </div>
              <span style={{ color: primary }}>{hero.badge1Text}</span>
            </div>
          </div>
        )}

        <h1
          className="mb-5 mt-16 max-w-lg text-center text-2xl font-extrabold leading-relaxed sm:mt-20 sm:text-3xl lg:text-4xl"
          style={{ fontFamily: "'Cairo', sans-serif" }}
        >
          {(() => {
            const fullTitle = title;
            const parts = fullTitle.split(/ في | إلى /);
            if (parts.length >= 2) {
              const separator = fullTitle.includes(" في ") ? " في " : " إلى ";
              return (
                <>
                  <span style={{ color: primary }}>{parts[0] + separator}</span>
                  <br />
                  <span style={{ color: secondary }}>{parts.slice(1).join(separator)}</span>
                </>
              );
            }
            return <span style={{ color: primary }}>{fullTitle}</span>;
          })()}
        </h1>

        <div className="relative mx-auto h-[280px] w-[280px] sm:h-[340px] sm:w-[340px]">
          <div
            className="absolute rounded-full"
            style={{
              inset: -20,
              background: `radial-gradient(circle, ${secondary}18, transparent 70%)`,
            }}
          />

          <div className="absolute inset-0 overflow-hidden rounded-full border-4 border-orange-400 shadow-2xl">
            {teacherImage ? (
              <Image
                src={teacherImage}
                alt={teacherName}
                fill
                sizes="(max-width: 640px) 280px, 340px"
                className="object-cover"
                priority
              />
            ) : (
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face"
                alt={teacherName}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {(icons?.gifts?.visible !== false) && (
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(calc(-50% + 180px), calc(-50% + 40px))" }}
          >
            <div className="flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] shadow-lg sm:h-12 sm:w-12 sm:border-[3.5px]" style={{ backgroundColor: primary, borderColor: "#F0B8A8" }}>
                <Gift className="h-4 w-4 text-white sm:h-5 sm:w-5" />
              </div>
              <span className="mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold text-white shadow-md sm:text-[10px] sm:px-2.5" style={{ backgroundColor: `${primary}dd` }}>
                {icons?.gifts?.label || "الهدايا"}
              </span>
            </div>
          </div>
          )}

          {(icons?.facebook?.visible !== false) && (
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(calc(-50% + 130px), calc(-50% + 130px))" }}
          >
            <div className="flex flex-col items-center">
              <a href={social?.facebook || "#"} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] shadow-lg sm:h-12 sm:w-12 sm:border-[3.5px]" style={{ backgroundColor: secondary, borderColor: "#FFE0A0" }}>
                  <Facebook className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                </div>
                <span className="mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold text-white shadow-md sm:text-[10px] sm:px-2.5" style={{ backgroundColor: `${secondary}dd` }}>
                  {icons?.facebook?.label || "فيس بوك"}
                </span>
              </a>
            </div>
          </div>
          )}

          {(icons?.chat?.visible !== false) && (
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(calc(-50% + 40px), calc(-50% + 180px))" }}
          >
            <div className="flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] shadow-lg sm:h-12 sm:w-12 sm:border-[3.5px]" style={{ backgroundColor: primary, borderColor: "#F0B8A8" }}>
                <MessageCircle className="h-4 w-4 text-white sm:h-5 sm:w-5" />
              </div>
              <span className="mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold text-white shadow-md sm:text-[10px] sm:px-2.5" style={{ backgroundColor: `${primary}dd` }}>
                {icons?.chat?.label || "محادثة مباشرة"}
              </span>
            </div>
          </div>
          )}

          {(icons?.youtube?.visible !== false) && (
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(calc(-50% - 40px), calc(-50% + 180px))" }}
          >
            <div className="flex flex-col items-center">
              <a href={social?.youtube || "#"} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] shadow-lg sm:h-12 sm:w-12 sm:border-[3.5px]" style={{ backgroundColor: secondary, borderColor: "#FFE0A0" }}>
                  <Youtube className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                </div>
                <span className="mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold text-white shadow-md sm:text-[10px] sm:px-2.5" style={{ backgroundColor: `${secondary}dd` }}>
                  {icons?.youtube?.label || "يوتيوب"}
                </span>
              </a>
            </div>
          </div>
          )}

          {(icons?.bestStudents?.visible !== false) && (
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(calc(-50% - 130px), calc(-50% + 130px))" }}
          >
            <div className="flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] shadow-lg sm:h-12 sm:w-12 sm:border-[3.5px]" style={{ backgroundColor: primary, borderColor: "#F0B8A8" }}>
                <Star className="h-4 w-4 text-white sm:h-5 sm:w-5" />
              </div>
              <span className="mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold text-white shadow-md sm:text-[10px] sm:px-2.5" style={{ backgroundColor: `${primary}dd` }}>
                {icons?.bestStudents?.label || "أفضل الطلاب"}
              </span>
            </div>
          </div>
          )}

          {(icons?.phone?.visible !== false) && (
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(calc(-50% - 180px), calc(-50% + 40px))" }}
          >
            <div
              className="relative flex flex-col items-center"
              onMouseEnter={() => setPhoneHovered(true)}
              onMouseLeave={() => setPhoneHovered(false)}
            >
              <div className="flex flex-col items-center">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] shadow-lg transition-all duration-300 sm:h-12 sm:w-12 sm:border-[3.5px]"
                  style={{
                    backgroundColor: secondary,
                    borderColor: "#FFE0A0",
                  }}
                >
                  <Phone className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                </div>
                <span
                  className="mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold text-white shadow-md transition-all duration-300 sm:text-[10px] sm:px-2.5"
                  style={{
                    backgroundColor: `${secondary}dd`,
                  }}
                >
                  {icons?.phone?.label || "رقم الهاتف"}
                </span>
              </div>

              {phoneHovered && (
                <div
                  className="absolute top-full mt-3 min-w-[220px] overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl"
                  style={{
                    direction: "rtl",
                  }}
                >
                  <a
                    href={social?.phone ? `tel:${social.phone}` : "#"}
                    className="flex items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-amber-50"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${secondary}20` }}
                    >
                      <PhoneCall className="h-5 w-5" style={{ color: secondary }} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800">اتصل بنا</span>
                      <span className="text-[11px] text-gray-500">دعم فني مباشر</span>
                    </div>
                  </a>

                  <div className="mx-4 h-px bg-gradient-to-l from-transparent via-gray-200 to-transparent" />

                  <a
                    href={social?.whatsapp ? `https://wa.me/${social.whatsapp.replace(/[^0-9]/g, "")}` : social?.phone ? `https://wa.me/${social.phone.replace(/[^0-9]/g, "")}` : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-green-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
                      <WhatsAppIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800">محادثة واتساب</span>
                      <span className="text-[11px] text-gray-500">راسلنا على الواتساب</span>
                    </div>
                  </a>
                </div>
              )}
            </div>
           </div>
          )}
        </div>
      </div>
    </section>
  );
}
