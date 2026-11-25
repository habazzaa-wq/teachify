import { describe, expect, it } from "vitest";

import {
  googleVerificationFileContent,
  isGoogleVerificationFileName,
} from "./verification-file";

describe("Google verification file helpers", () => {
  it("accepts only Google-generated .html file names", () => {
    expect(isGoogleVerificationFileName("googleabc123.html")).toBe(true);
    expect(isGoogleVerificationFileName("google-a_b-123.html")).toBe(true);
    expect(isGoogleVerificationFileName("googleabc123.html ")).toBe(true);
    expect(isGoogleVerificationFileName("googleabc123.txt")).toBe(false);
    expect(isGoogleVerificationFileName("logo.html")).toBe(false);
    expect(isGoogleVerificationFileName("../googleabc123.html")).toBe(false);
    expect(isGoogleVerificationFileName("googleabc.html<script>")).toBe(false);
  });

  it("derives the exact verification body from the file name", () => {
    expect(googleVerificationFileContent("googleabc123.html")).toBe(
      "google-site-verification: googleabc123.html",
    );
  });
});
