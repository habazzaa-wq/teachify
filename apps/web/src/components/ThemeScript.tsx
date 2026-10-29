import Script from "next/script";

const THEME_SCRIPT = `
(function() {
  var root = document.documentElement;
  var theme = "light";
  try {
    var stored = JSON.parse(localStorage.getItem("ui-state") || "{}");
    var storedTheme = stored && stored.state && stored.state.theme;
    if (storedTheme === "dark" || storedTheme === "light") {
      theme = storedTheme;
    } else {
      var cookieTheme = document.cookie.match(/(?:^|;\\s*)teachify-theme=(dark|light)(?:;|$)/);
      theme = cookieTheme ? cookieTheme[1] : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
  } catch (e) {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  try {
    document.cookie = "teachify-theme=" + theme + "; Path=/; Max-Age=31536000; SameSite=Lax" + (location.protocol === "https:" ? "; Secure" : "");
  } catch (e) {}
})();
`;

export function ThemeScript() {
  return (
    <Script id="theme-bootstrap" strategy="beforeInteractive">
      {THEME_SCRIPT}
    </Script>
  );
}
