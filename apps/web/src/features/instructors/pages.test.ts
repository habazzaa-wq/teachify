import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import InstructorChangePasswordPage from "../../app/(instructor)/instructor/change-password/page";
import InstructorCourseDetailPage from "../../app/(instructor)/instructor/courses/[courseId]/page";
import InstructorCoursesPage from "../../app/(instructor)/instructor/courses/page";
import NewInstructorCoursePage from "../../app/(instructor)/instructor/courses/new/page";
import InstructorLoginPage from "../../app/(instructor)/instructor/login/page";
import InstructorStudentsPage from "../../app/(instructor)/instructor/students/page";

vi.mock("next/link", () => ({
  default: ({ children }: { children: ReactNode }) => createElement("a", null, children),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ courseId: "42" }),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/features/instructors/InstructorAuthProvider", () => ({
  useInstructorAuth: () => ({
    user: { name: "Test Instructor" },
    membership: { permissions: ["courses.create", "courses.update"] },
    accessToken: "test-access-token",
    login: vi.fn(),
    changePassword: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("@/features/instructors/api", () => ({
  instructorApi: {
    listCourses: vi.fn(),
    createCourse: vi.fn(),
    getCourse: vi.fn(),
    updateCourse: vi.fn(),
    publishCourse: vi.fn(),
  },
  instructorApiErrorMessage: vi.fn(),
}));

vi.mock("@/providers/TenantProvider", () => ({
  useTenantContext: () => ({ activeTenant: { id: 1, name: "Test Academy" } }),
}));

function renderPage(page: () => ReactNode): string {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderToStaticMarkup(
    createElement(QueryClientProvider, { client: queryClient }, createElement(page)),
  );
}

describe("Instructor pages", () => {
  it("renders the dedicated Instructor login form", () => {
    const html = renderPage(InstructorLoginPage);

    expect(html).toContain("أهلاً بعودتك");
    expect(html).toContain("مساحة المدرّبين");
    expect(html).toContain("دخول آمن ومخصص لحسابات المدرّبين");
    expect(html).toContain("tenant-theme");
    expect(html).toContain("bg-secondary");
    expect(html).toContain("dark:scale-100");
    expect(html).toContain('aria-label="الوضع الليلي"');
    expect(html).toContain('type="email"');
    expect(html).toContain('type="password"');
    expect(html).toContain('aria-label="إظهار كلمة المرور"');
  });

  it("renders the required password-change form", () => {
    const html = renderPage(InstructorChangePasswordPage);

    expect(html).toContain("أنشئ كلمة مرورك الجديدة");
    expect(html).toContain("tenant-theme");
    expect(html).toContain("aria-label=\"قوة كلمة المرور\"");
    expect(html).toContain("minLength=\"8\"");
    expect(html).toContain("حفظ كلمة المرور والمتابعة");
    expect(html).toContain("aria-label=\"الوضع الليلي\"");
  });

  it("renders the admin-style course list in its loading state for the authenticated Instructor", () => {
    const html = renderPage(InstructorCoursesPage);

    expect(html).toContain("animate-pulse");
  });

  it("renders the course detail loading state", () => {
    const html = renderPage(InstructorCourseDetailPage);

    expect(html).toContain("جارٍ تحميل الدورة");
  });

  it("renders the course creation form", () => {
    const html = renderPage(NewInstructorCoursePage);

    expect(html).toContain("إنشاء دورة جديدة");
    expect(html).toContain("عنوان الدورة");
  });

  it("renders the read-only, scoped student workspace", () => {
    const html = renderPage(InstructorStudentsPage);

    expect(html).toContain("إدارة الطلاب");
    expect(html).toContain("الدورات المعيّنة لك فقط");
    expect(html).toContain("تصدير النتائج");
  });
});
