"use client";

import { type ReactNode } from "react";
import { LazyMotion, domMax } from "framer-motion";

export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domMax}>{children}</LazyMotion>;
}
