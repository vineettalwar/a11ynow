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
import { registerScrollTrigger } from "@/lib/register-scroll-trigger";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Subscribes to prefers-reduced-motion for entrance / decorative tweens. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
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
 * Hero copy: quick stagger when the audit loads.
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
 * Metrics (3D tilt stagger), score ring draw, centre score count-up, and screenshot curtain.
 * Re-runs when the score changes (e.g. audit row hydrates after a partial load).
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
    const roundedScore = Math.round(score);
    const key = `${auditId}:${roundedScore}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    const scoreCircle = scoreRingRef.current;
    const scoreNum = scoreNumberRef.current;
    const metrics = metricsRef.current;
    const shot = screenshotRef.current;

    const restoreScoreText = () => {
      if (scoreNum) scoreNum.textContent = String(roundedScore);
    };

    if (reducedMotion) {
      if (scoreCircle) {
        gsap.set(scoreCircle, {
          attr: { strokeDashoffset: RING_C - (RING_C * roundedScore) / 100 },
        });
      }
      restoreScoreText();
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
        const target = RING_C - (RING_C * roundedScore) / 100;
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
        tl.fromTo(
          scoreNum,
          { innerText: 0 },
          {
            innerText: roundedScore,
            duration: 1.05,
            ease: "power2.out",
            snap: { innerText: 1 },
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

    return () => {
      ctx.revert();
      lastKey.current = "";
      restoreScoreText();
    };
  }, [auditId, reducedMotion, score, scoreRingRef, scoreNumberRef, metricsRef, screenshotRef]);
}

function revealStuckViolationCards(list: HTMLElement): void {
  const cards = list.querySelectorAll<HTMLElement>("[data-violation-card]");
  cards.forEach((card) => {
    const opacity = gsap.getProperty(card, "opacity");
    const visibility = gsap.getProperty(card, "visibility");
    if (opacity === 0 || visibility === "hidden") {
      gsap.set(card, { clearProps: "opacity,visibility,transform,filter,clipPath" });
    }
  });
}

/**
 * Violation cards: scroll-linked reveal + toolbar glide-in.
 * Uses the whole violations section (toolbar + list) as the ScrollTrigger target so
 * layout shifts above (screenshot, compliance cards) cannot leave cards invisible
 * while the heading is already on screen.
 */
export function useViolationCardsEntrance(options: {
  auditId: string;
  violationFingerprint: string;
  violationCount: number;
  reducedMotion: boolean;
  violationsSectionRef: RefObject<HTMLDivElement | null>;
  violationsListRef: RefObject<HTMLDivElement | null>;
  violationsToolbarRef: RefObject<HTMLDivElement | null>;
}): void {
  const {
    auditId,
    violationFingerprint,
    violationCount,
    reducedMotion,
    violationsSectionRef,
    violationsListRef,
    violationsToolbarRef,
  } = options;
  const lastKey = useRef("");

  useLayoutEffect(() => {
    const section = violationsSectionRef.current;
    const list = violationsListRef.current;
    if (!auditId || !section || !list || violationCount === 0) return;
    const key = `${auditId}:${violationFingerprint}`;
    if (lastKey.current === key) return;

    const cards = list.querySelectorAll<HTMLElement>("[data-violation-card]");
    if (cards.length === 0) return;
    lastKey.current = key;

    const tb = violationsToolbarRef.current;

    if (reducedMotion) {
      gsap.set(cards, { clearProps: "opacity,visibility,transform,filter,clipPath" });
      if (tb) gsap.set(tb, { clearProps: "opacity,visibility,transform,filter" });
      return;
    }

    registerScrollTrigger();

    let revealed = false;
    const revealAll = () => {
      if (revealed) return;
      revealed = true;
      if (tb) {
        gsap.to(tb, {
          y: 0,
          autoAlpha: 1,
          filter: "blur(0px)",
          duration: 0.52,
          ease: "power3.out",
        });
      }
      gsap.to(cards, {
        autoAlpha: 1,
        y: 0,
        rotateX: 0,
        filter: "blur(0px)",
        duration: 0.72,
        stagger: { each: 0.08, from: "start" },
        ease: "back.out(1.14)",
      });
    };

    const ctx = gsap.context(() => {
      if (tb) {
        gsap.set(tb, { y: 22, autoAlpha: 0, filter: "blur(5px)" });
      }
      gsap.set(cards, {
        autoAlpha: 0,
        y: 52,
        rotateX: 9,
        transformOrigin: "50% 0%",
        filter: "blur(5px)",
      });

      ScrollTrigger.create({
        trigger: section,
        start: "top 92%",
        once: true,
        onEnter: revealAll,
      });

      // Content above (screenshot, compliance) can shift layout after first measure.
      ScrollTrigger.refresh();
      if (ScrollTrigger.isInViewport(section, 0.05)) {
        revealAll();
      }
    }, section);

    const refresh = () => {
      ScrollTrigger.refresh();
      if (ScrollTrigger.isInViewport(section, 0.05)) {
        revealAll();
      }
    };

    refresh();
    window.addEventListener("load", refresh);
    const refreshTimers = [400, 1200].map((ms) => window.setTimeout(refresh, ms));

    const failsafe = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          revealAll();
          revealStuckViolationCards(list);
        }
      },
      { root: null, threshold: 0.05 },
    );
    failsafe.observe(section);

    return () => {
      window.removeEventListener("load", refresh);
      refreshTimers.forEach(clearTimeout);
      failsafe.disconnect();
      ctx.revert();
      requestAnimationFrame(refresh);
    };
  }, [
    auditId,
    violationFingerprint,
    violationCount,
    reducedMotion,
    violationsSectionRef,
    violationsListRef,
    violationsToolbarRef,
  ]);
}

/** Emphasis when using Previous / Next: short timeline, respects reduced motion. */
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
