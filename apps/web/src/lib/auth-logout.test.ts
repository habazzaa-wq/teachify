import { afterEach, describe, expect, it } from "vitest";
import {
  beginAuthLogout,
  clearAuthLogout,
  isAuthLogoutPending,
  syncAuthLogout,
} from "./auth-logout";

describe("intentional logout marker", () => {
  afterEach(() => clearAuthLogout());

  it("stays active while the logout navigation is in flight", () => {
    expect(isAuthLogoutPending()).toBe(false);

    beginAuthLogout("/student/dashboard");
    expect(isAuthLogoutPending()).toBe(true);

    syncAuthLogout("/student/dashboard");
    expect(isAuthLogoutPending()).toBe(true);
  });

  it("clears once navigation lands on another page", () => {
    beginAuthLogout("/student/dashboard");
    syncAuthLogout("/");

    expect(isAuthLogoutPending()).toBe(false);
  });

  it("can be cleared on a new login", () => {
    beginAuthLogout("/teacher/dashboard");
    clearAuthLogout();

    expect(isAuthLogoutPending()).toBe(false);
  });
});
