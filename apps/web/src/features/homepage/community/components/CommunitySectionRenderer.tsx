"use client";

import type { CommunitySectionSettings } from "../types";
import { ClassicDesign } from "./designs/ClassicDesign";
import { GradientDesign } from "./designs/GradientDesign";
import { SpotlightDesign } from "./designs/SpotlightDesign";
import { BentoDesign } from "./designs/BentoDesign";
import { MinimalDesign } from "./designs/MinimalDesign";

/** Renders the chosen community-section design from dynamic settings. */
export function CommunitySectionRenderer({
  settings,
}: {
  settings: CommunitySectionSettings;
}) {
  switch (settings.design) {
    case "gradient":
      return <GradientDesign settings={settings} />;
    case "spotlight":
      return <SpotlightDesign settings={settings} />;
    case "bento":
      return <BentoDesign settings={settings} />;
    case "minimal":
      return <MinimalDesign settings={settings} />;
    case "classic":
    default:
      return <ClassicDesign settings={settings} />;
  }
}
