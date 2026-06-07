"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";

export function useBtnGsapHover(ref: RefObject<HTMLElement | null>, duration = 0.2) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const buttons = el.querySelectorAll<HTMLElement>(".btn-gsap");
    const cleanups: (() => void)[] = [];

    buttons.forEach((btn) => {
      const enter = () => gsap.to(btn, { scale: 1.04, duration, ease: "power2.out" });
      const leave = () => gsap.to(btn, { scale: 1, duration, ease: "power2.out" });
      btn.addEventListener("mouseenter", enter);
      btn.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        btn.removeEventListener("mouseenter", enter);
        btn.removeEventListener("mouseleave", leave);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [ref, duration]);
}
