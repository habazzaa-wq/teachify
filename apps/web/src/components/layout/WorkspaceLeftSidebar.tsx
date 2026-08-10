"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pin,
  Star,
  Layout,
  Palette,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  ClipboardList,
  GripVertical,
  Images,
  Megaphone,
  Home,
  User,
  Award,
  GraduationCap,
  BookOpen,
  TicketCheck,
  CreditCard,
  ImageIcon,
} from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { StudioSidebarSection } from "@/components/studio/navigation/StudioSidebarSection";
import { StudioSidebarItem } from "@/components/studio/navigation/StudioSidebarItem";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { routes } from "@/constants/routes";
import { cn } from "@/lib/cn";

const COLLAPSED_WIDTH = 68;
const MIN_WIDTH = 220;
const MAX_WIDTH = 400;

export function WorkspaceLeftSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    leftSidebarOpen,
    leftSidebarWidth,
    leftSidebarCollapsed,
    setLeftSidebarWidth,
    setLeftSidebarCollapsed,
  } = useWorkspaceStore();

  const [isResizing, setIsResizing] = useState(false);
  const isRTL = typeof document !== "undefined"
    ? document.documentElement.dir === "rtl"
    : true;

  const currentWidth = leftSidebarCollapsed ? COLLAPSED_WIDTH : leftSidebarWidth;

  const handleCollapseToggle = useCallback(() => {
    setLeftSidebarCollapsed(!leftSidebarCollapsed);
  }, [leftSidebarCollapsed, setLeftSidebarCollapsed]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      const startX = e.clientX;
      const startWidth = leftSidebarWidth;

      const handleMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        const newWidth = isRTL
          ? startWidth - delta
          : startWidth + delta;
        setLeftSidebarWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)));
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [leftSidebarWidth, setLeftSidebarWidth, isRTL],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "[" && e.metaKey) {
        e.preventDefault();
        handleCollapseToggle();
      }
    },
    [handleCollapseToggle],
  );

  useEffect(() => {
    if (!leftSidebarOpen) {
      setLeftSidebarCollapsed(true);
    }
  }, [leftSidebarOpen, setLeftSidebarCollapsed]);

  return (
    <AnimatePresence mode="wait">
      <motion.aside
        initial={false}
        animate={{
          width: currentWidth,
          opacity: 1,
        }}
        transition={{
          duration: 0.25,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={cn(
          "relative flex h-full flex-col overflow-hidden border-l border-studio-border bg-studio-glass-sidebar backdrop-blur-xl",
          isResizing && "select-none",
        )}
        role="navigation"
        aria-label="القائمة الجانبية"
        onKeyDown={handleKeyDown}
        dir="auto"
      >
        {/* Resize handle (only when expanded) */}
        {!leftSidebarCollapsed && (
          <div
            onMouseDown={handleResizeStart}
            className={cn(
              "absolute top-0 z-20 flex w-3 cursor-col-resize items-center justify-center transition-colors hover:bg-studio-accent/20",
              isResizing && "bg-studio-accent/20",
              isRTL ? "left-0" : "right-0",
            )}
            style={{ height: "100%" }}
            role="separator"
            aria-orientation="vertical"
            aria-label="تغيير عرض القائمة"
            tabIndex={0}
          >
            <GripVertical className="h-4 w-4 text-studio-fg-subtle" aria-hidden="true" />
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top section */}
          <div className="flex shrink-0 items-center justify-between border-b border-studio-border px-3 py-3">
            {!leftSidebarCollapsed && (
              <span className="text-xs font-semibold text-studio-fg-muted px-1">
                مساحة العمل
              </span>
            )}
            <StudioButton
              variant="ghost"
              size="icon"
              onClick={handleCollapseToggle}
              aria-label={leftSidebarCollapsed ? "توسيع القائمة" : "طي القائمة"}
            >
              {leftSidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </StudioButton>
          </div>

          {/* Scrollable nav area */}
          <div className="flex-1 overflow-y-auto studio-scrollbar py-2">
            {/* Workspace Switcher */}
            <StudioSidebarSection label={leftSidebarCollapsed ? undefined : "التبديل"} collapsed={leftSidebarCollapsed}>
              <StudioSidebarItem
                icon={<Layout className="h-4 w-4" />}
                label="مساحة العمل"
                collapsed={leftSidebarCollapsed}
              />
            </StudioSidebarSection>

            {/* Navigation placeholder */}
            <StudioSidebarSection label={leftSidebarCollapsed ? undefined : "التنقل"} collapsed={leftSidebarCollapsed}>
              <StudioSidebarItem
                icon={<Layout className="h-4 w-4" />}
                label="الرئيسية"
                collapsed={leftSidebarCollapsed}
              />
              <StudioSidebarItem
                icon={<Layout className="h-4 w-4" />}
                label="الكورسات"
                active={pathname.startsWith("/teacher/courses")}
                collapsed={leftSidebarCollapsed}
                onClick={() => router.push("/teacher/courses")}
              />
              <StudioSidebarItem
                icon={<Images className="h-4 w-4" />}
                label="مكتبة الوسائط"
                collapsed={leftSidebarCollapsed}
                onClick={() => router.push("/teacher/media")}
              />
              <StudioSidebarItem
                icon={<ClipboardList className="h-4 w-4" />}
                label="مكتبة الاختبارات"
                active={pathname.startsWith("/teacher/exams")}
                collapsed={leftSidebarCollapsed}
                onClick={() => router.push(routes.dashboardExams)}
              />
              <StudioSidebarItem
                icon={<BookOpen className="h-4 w-4" />}
                label="المواد"
                active={pathname.startsWith("/teacher/subjects")}
                collapsed={leftSidebarCollapsed}
                onClick={() => router.push(routes.dashboardSubjects)}
              />
              <StudioSidebarItem
                icon={<GraduationCap className="h-4 w-4" />}
                label="الطلاب"
                active={pathname.startsWith("/teacher/students")}
                collapsed={leftSidebarCollapsed}
                onClick={() => router.push(routes.dashboardStudents)}
              />
              <StudioSidebarItem
                icon={<TicketCheck className="h-4 w-4" />}
                label="أكواد الشحن"
                active={pathname.startsWith("/teacher/recharge-codes")}
                collapsed={leftSidebarCollapsed}
                onClick={() => router.push(routes.dashboardRechargeCodes)}
              />
            </StudioSidebarSection>

            {/* Pinned area */}
            <StudioSidebarSection label={leftSidebarCollapsed ? undefined : "المثبت"} collapsed={leftSidebarCollapsed}>
              <StudioSidebarItem
                icon={<Pin className="h-4 w-4" />}
                label="مساحة مثبتة"
                collapsed={leftSidebarCollapsed}
              />
            </StudioSidebarSection>

            {/* Favorites placeholder */}
            <StudioSidebarSection label={leftSidebarCollapsed ? undefined : "المفضلة"} collapsed={leftSidebarCollapsed}>
              <StudioSidebarItem
                icon={<Star className="h-4 w-4" />}
                label="سيتم إضافة المفضلة"
                collapsed={leftSidebarCollapsed}
              />
            </StudioSidebarSection>

            {/* Settings */}
            <StudioSidebarSection label={leftSidebarCollapsed ? undefined : "الإعدادات"} collapsed={leftSidebarCollapsed}>
              <StudioSidebarItem
                icon={<Globe className="h-4 w-4" />}
                label="إعدادات الموقع"
                active={pathname.startsWith(routes.dashboardSiteSettings)}
                collapsed={leftSidebarCollapsed}
                onClick={() => router.push(routes.dashboardSiteSettings)}
              />
              <StudioSidebarItem
                icon={<ImageIcon className="h-4 w-4" />}
                label="الشعار واسم المنصة"
                active={pathname.startsWith(routes.dashboardBranding)}
                collapsed={leftSidebarCollapsed}
                onClick={() => router.push(routes.dashboardBranding)}
              />
              <StudioSidebarItem
                icon={<Palette className="h-4 w-4" />}
                label="مظهر لوحة التحكم"
                collapsed={leftSidebarCollapsed}
                onClick={() => router.push("/teacher/settings/appearance")}
              />
              <StudioSidebarItem
                icon={<CreditCard className="h-4 w-4" />}
                label="بوابة الدفع"
                active={pathname.startsWith("/teacher/settings/payment-gateway")}
                collapsed={leftSidebarCollapsed}
                onClick={() => router.push("/teacher/settings/payment-gateway")}
              />
            </StudioSidebarSection>

            {/* Homepage management */}
            <StudioSidebarSection label={leftSidebarCollapsed ? undefined : "إدارة الصفحة الرئيسية"} collapsed={leftSidebarCollapsed}>
              <StudioSidebarItem
                icon={<Home className="h-4 w-4" />}
                label="إدارة الصفحة الرئيسية"
                active={pathname.startsWith("/teacher/homepage")}
                collapsed={leftSidebarCollapsed}
                onClick={() => router.push(routes.homepageNews)}
              />
              <StudioSidebarItem
                icon={<Megaphone className="h-4 w-4" />}
                label="شريط الأخبار"
                active={pathname === routes.homepageNews}
                collapsed={leftSidebarCollapsed}
                className="ps-7"
                onClick={() => router.push(routes.homepageNews)}
              />
              <StudioSidebarItem
                icon={<User className="h-4 w-4" />}
                label="البطاقة التعريفية"
                active={pathname === routes.homepageHero}
                collapsed={leftSidebarCollapsed}
                className="ps-7"
                onClick={() => router.push(routes.homepageHero)}
              />
              <StudioSidebarItem
                icon={<Award className="h-4 w-4" />}
                label="لماذا تختارنا؟"
                active={pathname === routes.homepageWhyChooseUs}
                collapsed={leftSidebarCollapsed}
                className="ps-7"
                onClick={() => router.push(routes.homepageWhyChooseUs)}
              />
              <StudioSidebarItem
                icon={<GraduationCap className="h-4 w-4" />}
                label="المراحل الدراسية"
                active={pathname === routes.homepageEducationalStages}
                collapsed={leftSidebarCollapsed}
                className="ps-7"
                onClick={() => router.push(routes.homepageEducationalStages)}
              />
            </StudioSidebarSection>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
