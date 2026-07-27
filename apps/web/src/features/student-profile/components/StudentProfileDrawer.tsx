"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Loader2, X, User, Mail, Phone, MapPin, BookOpen, Calendar, Shield } from "lucide-react";
import { useStudentProfile, useUploadAvatar } from "../hooks";
import { useAuthStore } from "@/stores/auth.store";

interface StudentProfileDrawerProps {
  open: boolean;
  onClose: () => void;
}

function FieldItem({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

export function StudentProfileDrawer({ open, onClose }: StudentProfileDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: profile, isLoading } = useStudentProfile();
  const uploadMutation = useUploadAvatar();

  const setUser = useAuthStore((s) => s.setUser);
  const currentUser = useAuthStore((s) => s.user);

  const avatarUrl = previewUrl ?? profile?.avatar ?? currentUser?.avatar;

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return;

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      try {
        const result = await uploadMutation.mutateAsync(file);
        if (currentUser) {
          setUser({ ...currentUser, avatar: result.avatar });
        }
        // Update localStorage so PublicNavbar picks up the new avatar
        try {
          const stored = localStorage.getItem("public-register-state");
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.avatar = result.avatar;
            localStorage.setItem("public-register-state", JSON.stringify(parsed));
          }
        } catch { /* ignore */ }
        setPreviewUrl(result.avatar);
      } catch {
        setPreviewUrl(null);
      } finally {
        URL.revokeObjectURL(objectUrl);
        e.target.value = "";
      }
    },
    [uploadMutation, currentUser, setUser],
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const genderLabel = profile?.gender === "male" ? "ذكر" : profile?.gender === "female" ? "أنثى" : profile?.gender || "غير محدد";

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-xl"
            >
              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="absolute end-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header */}
              <div className="flex flex-col items-center px-6 pt-8 pb-5">
                {/* Avatar */}
                <div className="relative group mb-4">
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    className="relative cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="تغيير الصورة الشخصية"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground text-xl font-semibold overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={profile?.name ?? ""} className="h-full w-full object-cover" />
                      ) : (
                        profile?.name ? getInitials(profile.name) : <User className="h-8 w-8" />
                      )}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                    {uploadMutation.isPending && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      </div>
                    )}
                  </button>
                </div>

                <h2 className="text-lg font-semibold text-foreground">{profile?.name}</h2>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>

              {/* Divider */}
              <div className="mx-6 border-t border-border" />

              {/* Content */}
              <div className="px-6 py-5">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : profile ? (
                  <div className="space-y-4">
                    {/* Personal Info */}
                    <div>
                      <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">البيانات الشخصية</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <FieldItem label="الاسم" value={profile.name} icon={User} />
                        <FieldItem label="البريد" value={profile.email} icon={Mail} />
                        <FieldItem label="الهاتف" value={profile.phone || "غير محدد"} icon={Phone} />
                        <FieldItem label="هاتف ولي الأمر" value={profile.parentPhone || "غير محدد"} icon={Phone} />
                        <FieldItem label="الجنس" value={genderLabel} icon={Shield} />
                        <FieldItem label="الجنسية" value={profile.nationality || "غير محدد"} icon={MapPin} />
                      </div>
                    </div>

                    {/* Study Info */}
                    <div>
                      <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">معلومات الدراسة</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <FieldItem label="المستوى الدراسي" value={profile.studyLevel || "غير محدد"} icon={BookOpen} />
                        <FieldItem label="المحافظة" value={profile.governorate || "غير محدد"} icon={MapPin} />
                        <FieldItem label="المدينة" value={profile.city || "غير محدد"} icon={MapPin} />
                      </div>
                    </div>

                    {/* Account Info */}
                    <div>
                      <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">معلومات الحساب</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <FieldItem
                          label="تاريخ الانضمام"
                          value={profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" }) : "غير محدد"}
                          icon={Calendar}
                        />
                        <FieldItem
                          label="تاريخ الإنشاء"
                          value={new Date(profile.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                          icon={Calendar}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                    <User className="h-10 w-10" />
                    <p className="text-sm">لم يتم العثور على البيانات</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
