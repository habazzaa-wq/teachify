import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import InstructorChangePasswordPage from "../../app/(instructor)/instructor/change-password/page";
import InstructorCourseDetailPage from "../../app/(instructor)/instructor/courses/[courseId]/page";
import InstructorCoursesPage from "../../app/(instructor)/instructor/courses/page";
import InstructorLoginPage from "../../app/(instructor)/instructor/login/page";

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
    accessToken: "test-access-token",
    login: vi.fn(),
    changePassword: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("@/features/instructors/api", () => ({
  instructorApi: {
    listCourses: vi.fn(),
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
  return renderToStaticMarkup(createElement(page));
}

describe("Instructor pages", () => {
  it("renders the dedicated Instructor login form", () => {
    const html = renderPage(InstructorLoginPage);

    expect(html).toContain("دخول المدرّس");
    expect(html).toContain('type="email"');
    expect(html).toContain('type="password"');
  });

  it("renders the required password-change form", () => {
    const html = renderPage(InstructorChangePasswordPage);

    expect(html).toContain("تغيير كلمة المرور");
    expect(html).toContain("يجب تعيين كلمة مرور جديدة");
    expect(html).toContain("minLength=\"8\"");
  });

  it("renders the course list in its loading state for the authenticated Instructor", () => {
    const html = renderPage(InstructorCoursesPage);

    expect(html).toContain("مرحباً، Test Instructor");
    expect(html).toContain("الدورات المعيّنة لك");
    expect(html).toContain("جارٍ تحميل الدورات");
  });

  it("renders the course detail loading state", () => {
    const html = renderPage(InstructorCourseDetailPage);

    expect(html).toContain("جارٍ تحميل الدورة");
  });
});
