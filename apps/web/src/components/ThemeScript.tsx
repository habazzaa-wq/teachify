const THEME_SCRIPT = `
(function() {
  var root = document.documentElement;
  var theme = "light";
  root.classList.add("theme-initializing");
  try {
    var stored = JSON.parse(localStorage.getItem("ui-state") || "{}");
    var storedTheme = stored && stored.state && stored.state.theme;
    if (storedTheme === "dark" || storedTheme === "light") {
      theme = storedTheme;
    } else {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
  } catch (e) {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
})();
`;

export function ThemeScript() {
  return (
    <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
  );
}
