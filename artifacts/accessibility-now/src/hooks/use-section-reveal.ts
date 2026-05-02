import { useEffect, useRef } from "react";
import gsap from "gsap";

export function useSectionReveal<T extends HTMLElement = HTMLElement>(
  options: { staggerSelector?: string; headingSelector?: string } = {}
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const headingSelector = options.headingSelector ?? "h1, h2, .section-label";
    const staggerSelector = options.staggerSelector ?? ".reveal-child";

    const headings = el.querySelectorAll<HTMLElement>(headingSelector);
    const bodyParagraphs = el.querySelectorAll<HTMLElement>(":scope > div > p, .reveal-body");
    const staggerEls = el.querySelectorAll<HTMLElement>(staggerSelector);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      gsap.set([headings, bodyParagraphs, staggerEls], { opacity: 1, y: 0 });
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top 82%",
        once: true,
      },
    });

    if (headings.length) {
      tl.from(headings, {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power3.out",
      });
    }

    if (bodyParagraphs.length) {
      tl.from(
        bodyParagraphs,
        { y: 30, opacity: 0, duration: 0.6, stagger: 0.07, ease: "power3.out" },
        headings.length ? "-=0.45" : ">"
      );
    }

    if (staggerEls.length) {
      tl.from(
        staggerEls,
        { y: 40, opacity: 0, duration: 0.55, stagger: 0.09, ease: "power3.out" },
        "-=0.3"
      );
    }

    return () => {
      tl.kill();
    };
  }, []);

  return ref;
}
