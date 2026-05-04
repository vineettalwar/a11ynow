import type { AuditViolation } from "@workspace/api-client-react";

export interface ManualFollowUpItem {
  id: string;
  title: string;
  detail: string;
}

const KEYBOARD_RULE_RE =
  /tabindex|focus|keyboard|bypass|scrollable|accesskeys|nested-interactive|aria-hidden-focus/i;
const COLOUR_RULE_RE = /color-contrast|link-in-text-block/i;
const MEDIA_RULE_RE = /video|audio|caption|track|object|embed/i;
const ARIA_RULE_RE = /^aria-|role-|scope-|valid-attr|heading-order|landmark|region/i;

/**
 * Deterministic manual checks suggested from automated rule ids (not a substitute for full QA).
 */
export function getManualFollowUpsFromViolations(violations: AuditViolation[]): ManualFollowUpItem[] {
  const out: ManualFollowUpItem[] = [];
  const seen = new Set<string>();

  const add = (id: string, title: string, detail: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    out.push({ id, title, detail });
  };

  let needsKeyboard = false;
  let needsColour = false;
  let needsSr = false;
  let needsMedia = false;
  let needsMotion = false;

  for (const v of violations) {
    if (KEYBOARD_RULE_RE.test(v.id)) needsKeyboard = true;
    if (COLOUR_RULE_RE.test(v.id)) needsColour = true;
    if (ARIA_RULE_RE.test(v.id) || /name|label|alt|img|heading|landmark/i.test(v.id)) needsSr = true;
    if (MEDIA_RULE_RE.test(v.id)) needsMedia = true;
    if (/autoplay|prefers-reduced-motion|animation|motion/i.test(v.id)) needsMotion = true;
  }

  if (needsKeyboard || violations.some((v) => v.id === "bypass")) {
    add(
      "keyboard-pass",
      "Keyboard-only pass",
      "Tab through the entire page: verify a visible focus ring, logical order, no traps, and that every control works with Enter/Space where expected.",
    );
  }
  if (needsColour) {
    add(
      "contrast-verify",
      "Contrast in context",
      "Use the in-browser contrast checker on real UI states (hover, selected, disabled) — automated ratios can miss gradients or text over images.",
    );
  }
  if (needsSr) {
    add(
      "screen-reader-spot",
      "Screen reader spot-check",
      "Skim with VoiceOver, NVDA, or TalkBack: landmarks, headings, form names, and live regions should match what sighted users understand.",
    );
  }
  if (needsMedia) {
    add(
      "media-manual",
      "Media controls and alternatives",
      "Confirm captions, transcripts or audio descriptions where required, and that custom players are keyboard-operable.",
    );
  }
  if (needsMotion) {
    add(
      "reduced-motion",
      "Reduced motion preference",
      "With prefers-reduced-motion: reduce, ensure critical information is not conveyed only through animation.",
    );
  }

  add(
    "zoom-200",
    "Zoom to 200%",
    "Browser zoom to 200%: no horizontal clipping of main content, no overlapping text, and interactive targets still usable.",
  );

  return out;
}
