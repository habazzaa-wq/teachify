"use client";

import { useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { StudioCommandPalette } from "@/components/studio/overlays/StudioCommandPalette";
import { useWorkspaceStore } from "@/stores/workspace.store";

export function WorkspaceGlobalSearch() {
  const globalSearchOpen = useWorkspaceStore((s) => s.globalSearchOpen);
  const setGlobalSearchOpen = useWorkspaceStore((s) => s.setGlobalSearchOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setGlobalSearchOpen(!globalSearchOpen);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [globalSearchOpen, setGlobalSearchOpen]);

  const commandItems = useMemo(
    () => [
      {
        id: "dashboard",
        label: "الرئيسية",
        description: "الانتقال إلى لوحة التحكم",
        icon: <Search className="h-4 w-4" />,
        category: "التنقل",
        onSelect: () => {
          window.location.href = "/teacher/dashboard";
        },
      },
      {
        id: "courses",
        label: "المقررات",
        description: "إدارة المقررات الدراسية",
        icon: <Search className="h-4 w-4" />,
        category: "التنقل",
        onSelect: () => {
          window.location.href = "/teacher/courses";
        },
      },
      {
        id: "students",
        label: "الطلاب",
        description: "إدارة الطلاب",
        icon: <Search className="h-4 w-4" />,
        category: "التنقل",
        onSelect: () => {
          window.location.href = "/teacher/students";
        },
      },
      {
        id: "settings",
        label: "الإعدادات",
        description: "إعدادات مساحة العمل",
        icon: <Search className="h-4 w-4" />,
        category: "التنقل",
        onSelect: () => {
          window.location.href = "/teacher/settings";
        },
      },
      {
        id: "theme-toggle",
        label: "تبديل السمة",
        description: "التبديل بين الوضع النهاري والليلي",
        icon: <Search className="h-4 w-4" />,
        category: "الإجراءات",
      },
      {
        id: "inspector-toggle",
        label: "إظهار/إخفاء لوحة الخصائص",
        description: "تبديل ظهور لوحة الخصائص الجانبية",
        icon: <Search className="h-4 w-4" />,
        category: "الإجراءات",
      },
    ],
    [],
  );

  return (
    <StudioCommandPalette
      open={globalSearchOpen}
      onClose={() => setGlobalSearchOpen(false)}
      items={commandItems}
      placeholder="ابحث عن أمر..."
    />
  );
}
