const THEME_SCRIPT = `
(function() {
  try {
    var stored = JSON.parse(localStorage.getItem("ui-state") || "{}");
    var theme = stored && stored.state && stored.state.theme;
    if (!theme) {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    }
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export function ThemeScript() {
  return (
    <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
  );
}
