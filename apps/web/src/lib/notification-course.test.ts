import { describe, expect, it } from "vitest";
import { notificationCourseId, notificationCourseHref } from "./notification-course";

describe("notification course link", () => {
  const enrolled = [
    { id: "12", slug: "algebra" },
    { id: "34", slug: "geometry-1" },
  ];

  it("reads a course id from string or numeric notification data", () => {
    expect(notificationCourseId({ data: { course_id: "12" } })).toBe("12");
    expect(notificationCourseId({ data: { course_id: 34 } })).toBe("34");
  });

  it("returns the enrolled course's public URL", () => {
    expect(notificationCourseHref({ data: { course_id: 12 } }, enrolled)).toBe(
      "/courses/algebra",
    );
    expect(notificationCourseHref({ data: { course_id: "34" } }, enrolled)).toBe(
      "/courses/geometry-1",
    );
  });

  it("encodes slugs that need it", () => {
    expect(
      notificationCourseHref(
        { data: { course_id: "12" } },
        [{ id: "12", slug: "math & science" }],
      ),
    ).toBe("/courses/math%20%26%20science");
  });

  it("stays silent when course data or enrollment is missing", () => {
    expect(notificationCourseHref({ data: null }, enrolled)).toBeNull();
    expect(notificationCourseHref({ data: {} }, enrolled)).toBeNull();
    expect(notificationCourseHref({ data: { course_id: null } }, enrolled)).toBeNull();
    expect(notificationCourseHref({ data: { course_id: "999" } }, enrolled)).toBeNull();
    expect(notificationCourseHref({ data: { course_id: "12" } }, [])).toBeNull();
    expect(notificationCourseHref({ data: { course_id: "12" } }, null)).toBeNull();
    expect(
      notificationCourseHref({ data: { course_id: "12" } }, [{ id: "12", slug: "" }]),
    ).toBeNull();
  });
});
