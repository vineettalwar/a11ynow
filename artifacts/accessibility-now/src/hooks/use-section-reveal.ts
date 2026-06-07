import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { registerScrollTrigger } from "@/lib/register-scroll-trigger";

const SCROLL_START = "top 90%";

export function useSectionReveal<T extends HTMLElement = HTMLElement>(
  options: { staggerSelector?: string; headingSelector?: string } = {},
) {
  const ref = useRef<T>(null);
  const headingSelector = options.headingSelector ?? "h1, h2, .section-label";
  const staggerSelector = options.staggerSelector ?? ".reveal-child";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const headings = el.querySelectorAll<HTMLElement>(headingSelector);
    const bodyParagraphs = el.querySelectorAll<HTMLElement>(":scope > div > p, .reveal-body");
    const staggerEls = el.querySelectorAll<HTMLElement>(staggerSelector);
    const animatedEls = [...headings, ...bodyParagraphs, ...staggerEls];

    if (!animatedEls.length) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    registerScrollTrigger();

    let revealed = false;
    let trigger: ScrollTrigger | undefined;

    const revealAll = () => {
      if (revealed) return;
      revealed = true;
      trigger?.kill();
      el.dataset.revealed = "true";

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (headings.length) {
        tl.to(headings, {
          y: 0,
          autoAlpha: 1,
          duration: 0.7,
          stagger: 0.08,
        });
      }

      if (bodyParagraphs.length) {
        tl.to(
          bodyParagraphs,
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.6,
            stagger: 0.07,
          },
          headings.length ? "-=0.45" : 0,
        );
      }

      if (staggerEls.length) {
        tl.to(
          staggerEls,
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.55,
            stagger: 0.09,
          },
          "-=0.3",
        );
      }
    };

    const ctx = gsap.context(() => {
      if (headings.length) {
        gsap.set(headings, { y: 40, autoAlpha: 0 });
      }
      if (bodyParagraphs.length) {
        gsap.set(bodyParagraphs, { y: 30, autoAlpha: 0 });
      }
      if (staggerEls.length) {
        gsap.set(staggerEls, { y: 40, autoAlpha: 0 });
      }

      trigger = ScrollTrigger.create({
        trigger: el,
        start: SCROLL_START,
        once: true,
        onEnter: revealAll,
      });
    }, el);

    const refreshAndMaybeReveal = () => {
      ScrollTrigger.refresh();
      if (ScrollTrigger.isInViewport(el, 0.05)) {
        revealAll();
      }
    };

    refreshAndMaybeReveal();
    window.addEventListener("load", refreshAndMaybeReveal);
    void document.fonts?.ready.then(refreshAndMaybeReveal);
    const refreshTimers = [400, 1200].map((ms) => window.setTimeout(refreshAndMaybeReveal, ms));

    return () => {
      window.removeEventListener("load", refreshAndMaybeReveal);
      refreshTimers.forEach((id) => window.clearTimeout(id));
      trigger?.kill();
      delete el.dataset.revealed;
      ctx.revert();
    };
  }, [headingSelector, staggerSelector]);

  return ref;
}
