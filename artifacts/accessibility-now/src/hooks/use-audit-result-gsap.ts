import {
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
  type RefObject,
  type MutableRefObject,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let scrollTriggerRegistered = false;
function ensureScrollTrigger(): void {
  if (typeof window === "undefined" || scrollTriggerRegistered) return;
  gsap.registerPlugin(ScrollTrigger);
  scrollTriggerRegistered = true;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Subscribes to prefers-reduced-motion for entrance / decorative tweens. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

const RING_C = 390;

type EntranceRefs = {
  scoreRingRef: RefObject<SVGCircleElement | null>;
  scoreNumberRef: RefObject<HTMLDivElement | null>;
  metricsRef: RefObject<HTMLDivElement | null>;
  screenshotRef: RefObject<HTMLDivElement | null>;
};

/**
 * Hero copy — quick stagger when the audit loads.
 */
export function useAuditHeroEntrance(options: {
  auditId: string;
  reducedMotion: boolean;
  heroRef: RefObject<HTMLElement | null>;
}): void {
  const { auditId, reducedMotion, heroRef } = options;
  const lastKey = useRef("");

  useLayoutEffect(() => {
    if (!auditId) return;
    if (lastKey.current === auditId) return;

    const root = heroRef.current;
    if (!root) return;
    const lines = root.querySelectorAll<HTMLElement>("[data-hero-line]");
    if (lines.length === 0) return;
    lastKey.current = auditId;

    if (reducedMotion) {
      gsap.set(lines, { clearProps: "opacity,visibility,transform,filter" });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(lines, {
        y: 26,
        autoAlpha: 0,
        filter: "blur(6px)",
        duration: 0.62,
        stagger: { each: 0.07, from: "start" },
        ease: "power3.out",
      });
    }, root);

    return () => ctx.revert();
  }, [auditId, reducedMotion, heroRef]);
}

/**
 * Metrics (3D tilt stagger), score ring draw, centre score count-up, and screenshot curtain — once per auditId.
 */
export function useAuditMetricsEntrance(options: {
  auditId: string;
  reducedMotion: boolean;
  score: number;
} & EntranceRefs): void {
  const { auditId, reducedMotion, score, scoreRingRef, scoreNumberRef, metricsRef, screenshotRef } = options;
  const lastKey = useRef("");

  useLayoutEffect(() => {
    if (!auditId) return;
    const key = auditId;
    if (lastKey.current === key) return;
    lastKey.current = key;

    const scoreCircle = scoreRingRef.current;
    const scoreNum = scoreNumberRef.current;
    const metrics = metricsRef.current;
    const shot = screenshotRef.current;

    if (reducedMotion) {
      if (scoreCircle) {
        gsap.set(scoreCircle, {
          attr: { strokeDashoffset: RING_C - (RING_C * score) / 100 },
        });
      }
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (metrics) {
        const cards = metrics.querySelectorAll<HTMLElement>("[data-audit-metric-card]");
        tl.from(
          cards,
          {
            y: 32,
            autoAlpha: 0,
            rotateX: 4,
            transformOrigin: "50% 80%",
            duration: 0.58,
            stagger: { each: 0.07, from: "start" },
            ease: "back.out(1.15)",
          },
          0,
        );

      }

      if (scoreCircle) {
        const target = RING_C - (RING_C * score) / 100;
        tl.fromTo(
          scoreCircle,
          { attr: { strokeDashoffset: RING_C } },
          {
            attr: { strokeDashoffset: target },
            duration: 1.18,
            ease: "power2.inOut",
          },
          0.05,
        );
      }

      if (scoreNum) {
        const proxy = { v: 0 };
        const end = Math.round(score);
        scoreNum.textContent = "0";
        tl.to(
          proxy,
          {
            v: end,
            duration: 1.05,
            ease: "power2.out",
            onUpdate: () => {
              scoreNum.textContent = String(Math.round(proxy.v));
            },
            onComplete: () => {
              scoreNum.textContent = String(end);
            },
          },
          0.08,
        );
      }

      if (shot) {
        const inner = shot.querySelector<HTMLElement>("[data-screenshot-inner]");
        const target = inner ?? shot;
        tl.fromTo(
          target,
          {
            clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
            autoAlpha: 0,
            scale: 0.94,
            filter: "blur(10px)",
          },
          {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
            autoAlpha: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.95,
            ease: "power3.out",
          },
          0.14,
        );
      }
    });

    return () => ctx.revert();
  }, [auditId, reducedMotion, score, scoreRingRef, scoreNumberRef, metricsRef, screenshotRef]);
}

/**
 * Violation cards: scroll-linked reveal + toolbar glide-in.
 */
export function useViolationCardsEntrance(options: {
  auditId: string;
  violationFingerprint: string;
  violationCount: number;
  reducedMotion: boolean;
  violationsListRef: RefObject<HTMLDivElement | null>;
  violationsToolbarRef: RefObject<HTMLDivElement | null>;
}): void {
  const {
    auditId,
    violationFingerprint,
    violationCount,
    reducedMotion,
    violationsListRef,
    violationsToolbarRef,
  } = options;
  const lastKey = useRef("");

  useLayoutEffect(() => {
    const list = violationsListRef.current;
    if (!auditId || !list || violationCount === 0) return;
    const key = `${auditId}:${violationFingerprint}`;
    if (lastKey.current === key) return;

    const cards = list.querySelectorAll<HTMLElement>("[data-violation-card]");
    if (cards.length === 0) return;
    lastKey.current = key;

    if (reducedMotion) {
      gsap.set(cards, { clearProps: "opacity,visibility,transform,filter,clipPath" });
      const tb = violationsToolbarRef.current;
      if (tb) gsap.set(tb, { clearProps: "opacity,visibility,transform,filter" });
      return;
    }

    ensureScrollTrigger();

    const ctx = gsap.context(() => {
      const tb = violationsToolbarRef.current;
      if (tb) {
        gsap.from(tb, {
          y: 22,
          autoAlpha: 0,
          filter: "blur(5px)",
          duration: 0.52,
          ease: "power3.out",
        });
      }

      gsap.set(cards, {
        autoAlpha: 0,
        y: 52,
        rotateX: 9,
        transformOrigin: "50% 0%",
        filter: "blur(5px)",
      });

      const tweenTo = {
        autoAlpha: 1,
        y: 0,
        rotateX: 0,
        filter: "blur(0px)",
        duration: 0.72,
        stagger: { each: 0.08, from: "start" as const },
        ease: "back.out(1.14)" as const,
      };

      const vh = window.innerHeight;
      const listTop = list.getBoundingClientRect().top;
      // Treat as in-view if the list has started entering the viewport (not only when it is
      // high in the frame). Previously we used vh * 0.92, which paired with start: "top 88%"
      // left cards at autoAlpha: 0 while the Violations heading and nav were already visible.
      const mostlyVisible = listTop < vh * 1.02;

      if (mostlyVisible) {
        gsap.to(cards, { ...tweenTo, delay: 0.06 });
      } else {
        gsap.to(cards, {
          ...tweenTo,
          scrollTrigger: {
            trigger: list,
            // Fire as soon as the list begins intersecting the viewport from below — avoids a
            // persistent blank strip under the Violations toolbar until the user scrolls far.
            start: "top bottom",
            once: true,
          },
        });
      }
    });

    return () => {
      ctx.revert();
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };
  }, [
    auditId,
    violationFingerprint,
    violationCount,
    reducedMotion,
    violationsListRef,
    violationsToolbarRef,
  ]);
}

/** Emphasis when using Previous / Next — short timeline, respects reduced motion. */
export function useViolationNavPulse(
  articleRefs: MutableRefObject<Array<HTMLElement | null>>,
  index: number,
  pulseToken: number,
  reducedMotion: boolean,
): void {
  useLayoutEffect(() => {
    if (reducedMotion || pulseToken <= 0) return;
    const el = articleRefs.current[index];
    if (!el) return;

    gsap.killTweensOf(el);
    const tl = gsap.timeline();
    tl.fromTo(
      el,
      { boxShadow: "0 0 0 0 rgba(255, 77, 28, 0)", filter: "brightness(1)" },
      {
        boxShadow: "0 0 0 4px rgba(255, 77, 28, 0.35), 0 20px 50px -18px rgba(0,0,0,0.18)",
        filter: "brightness(1.03)",
        duration: 0.22,
        ease: "power2.out",
      },
    ).to(el, {
      boxShadow: "0 0 0 0 rgba(255, 77, 28, 0)",
      filter: "brightness(1)",
      duration: 0.45,
      ease: "power3.inOut",
    });
  }, [articleRefs, index, pulseToken, reducedMotion]);
}
