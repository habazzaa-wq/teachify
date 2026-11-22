/** True when the current browser route belongs to the dedicated instructor workspace. */
export function isInstructorWorkspace(): boolean {
  return (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/instructor/")
  );
}

export function courseContentQueryScope(): "instructor" | "tenant" {
  return isInstructorWorkspace() ? "instructor" : "tenant";
}
