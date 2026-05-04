/**
 * Human-centered copy for automated audit violations.
 *
 * Content guidelines (editorial):
 * - Use person-respecting language: “people who use …”, not “the blind” or “normal users”.
 * - Describe assistive strategies (screen readers, keyboard-only, voice control), not medical labels.
 * - Avoid inspiration framing, tragedy tropes, or implying a single disability “owns” a rule.
 * - Automated checks catch a subset of WCAG issues; copy must not promise full conformance.
 */

import type { AuditViolation } from "@workspace/api-client-react";

export type HumanViolationContext = {
  /** One short sentence a non-expert can read first */
  plainLead: string;
  /** Shown in “What happens for users” when different from plainLead */
  whatHappens?: string;
  /** Short labels for chips (assistive strategies / needs, not diagnoses) */
  whoIsAffected: string[];
  /** One sentence tying the fix to a real outcome */
  whenYouFixIt: string;
  /** Optional factual micro-copy; omit if it would sound patronizing */
  didYouKnow?: string;
  /** True when no curated row matched; copy still safe to show */
  fallback: boolean;
  /** In-app route for `Link`, e.g. `/tools/contrast-checker` */
  relatedToolPath?: string;
};

type RuleEntry = Omit<HumanViolationContext, "fallback">;

const BY_RULE: Record<string, RuleEntry> = {
  "color-contrast": {
    plainLead: "Some text or controls may be hard to read against the background.",
    whatHappens:
      "People with low vision—or anyone on a bright screen or cheap monitor—can miss small or low-contrast text.",
    whoIsAffected: ["People with low vision", "Anyone in glare or sunlight", "People using colour filters"],
    whenYouFixIt: "Stronger contrast makes words and controls readable without zooming or squinting.",
    didYouKnow:
      "WCAG uses measurable contrast ratios so “looks fine to me” can be checked consistently.",
    relatedToolPath: "/tools/contrast-checker",
  },
  "image-alt": {
    plainLead: "An image is missing a text alternative, or the alternative is empty.",
    whatHappens:
      "When images carry meaning, people who use screen readers only hear “image” unless there is useful alt text.",
    whoIsAffected: ["People who use screen readers", "People on slow connections where images fail to load"],
    whenYouFixIt: "Short, accurate alt text lets assistive tech describe the image the way you intend.",
  },
  "input-image-alt": {
    plainLead: "An image button is missing a name that assistive technology can read.",
    whatHappens: "Screen readers may announce a generic “button” with no hint what it does.",
    whoIsAffected: ["People who use screen readers", "Voice control users who speak the button name"],
    whenYouFixIt: "Add alt text (or an accessible name) that matches the action, e.g. “Search” or “Submit order”.",
  },
  "object-alt": {
    plainLead: "An embedded object may not have a text alternative.",
    whatHappens: "Assistive technology may skip the object or announce it with no useful label.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Provide a short description or title so users know what the object is before interacting.",
  },
  "svg-img-alt": {
    plainLead: "An SVG used as an image may be missing an accessible name.",
    whatHappens: "Decorative-looking SVGs often carry icons or logos that convey meaning without text.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Add a title, aria-label, or screen-reader-only text that matches the meaning of the graphic.",
  },
  "role-img-alt": {
    plainLead: "Something marked as an image for assistive tech has no accessible name.",
    whatHappens: "Screen readers treat it as meaningful imagery but have nothing to read out.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Give the element a concise accessible name that matches what sighted users see.",
  },
  "area-alt": {
    plainLead: "A clickable image region may be missing alt text.",
    whatHappens: "Users exploring the image map may not hear what each hotspot does.",
    whoIsAffected: ["People who use screen readers", "Keyboard-only users"],
    whenYouFixIt: "Each area needs alt text that describes the destination or action.",
  },
  "image-redundant-alt": {
    plainLead: "Alt text may repeat what is already next to the image.",
    whatHappens: "Screen readers can read the same phrase twice, which slows people down.",
    whoIsAffected: ["People who use screen readers", "People who use reading aids"],
    whenYouFixIt: "Use empty alt for decorative images, or one clear phrase if the image adds new information.",
  },
  label: {
    plainLead: "A form control may not be programmatically tied to its visible label.",
    whatHappens:
      "Screen readers may not associate the label with the field, so people hear a generic “edit box”.",
    whoIsAffected: ["People who use screen readers", "Voice control users"],
    whenYouFixIt: "Use a real label element or aria-labelledby so the field’s name is announced correctly.",
  },
  "label-title-only": {
    plainLead: "A field might only be named by a tooltip-style title, which many assistive tools ignore.",
    whatHappens: "The visible text may not be what assistive technology uses as the field name.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Use an associated label (or aria-labelledby) that matches what users read on screen.",
  },
  "select-name": {
    plainLead: "A dropdown may not have an accessible name.",
    whatHappens: "People may hear “list box” with no idea what they are choosing.",
    whoIsAffected: ["People who use screen readers", "Voice control users"],
    whenYouFixIt: "Add a visible label or aria-label that states the purpose of the select.",
  },
  "form-field-multiple-labels": {
    plainLead: "This field may be linked to more than one label, which confuses assistive technology.",
    whatHappens: "Screen readers can merge or pick the wrong label, so the announced name is unclear.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Keep one clear label (or one aria-labelledby chain) per control.",
  },
  "button-name": {
    plainLead: "A button may not have a name that assistive technology can read.",
    whatHappens: "Icon-only buttons are often announced as “button” with no action.",
    whoIsAffected: ["People who use screen readers", "Voice control users"],
    whenYouFixIt: "Add visible text, aria-label, or aria-labelledby that says what the button does.",
  },
  "input-button-name": {
    plainLead: "A submit or image input may lack an accessible name.",
    whatHappens: "Users may not know what will happen when they activate the control.",
    whoIsAffected: ["People who use screen readers", "Keyboard-only users"],
    whenYouFixIt: "Set the value attribute or an accessible name so the action is clear.",
  },
  "link-name": {
    plainLead: "A link may not have discernible text (or a name) for assistive technology.",
    whatHappens: "Screen readers may announce “link” with no destination, or read a long URL.",
    whoIsAffected: ["People who use screen readers", "People who scan links out of context"],
    whenYouFixIt: "Use link text that makes sense on its own, e.g. “Pricing” instead of “click here”.",
  },
  "link-in-text-block": {
    plainLead: "A link inside a paragraph may be styled so it does not look like a link.",
    whatHappens: "People who rely on colour or underline cues can miss that text is clickable.",
    whoIsAffected: ["People with low vision", "People who use high-contrast themes"],
    whenYouFixIt: "Use more than colour alone—underline, weight, or icon—to show links.",
  },
  "document-title": {
    plainLead: "The page title may be missing or unhelpful.",
    whatHappens: "The title is the first hint in tabs and search results; a poor title makes pages hard to find.",
    whoIsAffected: ["Everyone", "People who use screen readers (title is read on navigation)"],
    whenYouFixIt: "Set a concise, unique title that matches the page’s main task.",
  },
  "html-has-lang": {
    plainLead: "The page may not declare its primary language.",
    whatHappens: "Screen readers may pick the wrong pronunciation rules for the whole page.",
    whoIsAffected: ["People who use screen readers", "People using translation tools"],
    whenYouFixIt: "Add a lang attribute on html that matches the main language of the content.",
  },
  "html-lang-valid": {
    plainLead: "The language code on the page may be invalid or not recognized.",
    whatHappens: "Assistive technology may fall back to the wrong voice or dictionary.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Use a valid BCP 47 language tag (e.g. en-GB, fr-CA).",
  },
  "html-xml-lang-mismatch": {
    plainLead: "The HTML lang and XML lang attributes may disagree.",
    whatHappens: "Tools may not know which pronunciation or translation rules to apply.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Make html lang and xml:lang match the same primary language.",
  },
  "valid-lang": {
    plainLead: "A language change inside the page may use an invalid code.",
    whatHappens: "Assistive technology may mispronounce a phrase or block of text.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Fix the lang attribute on the element that wraps the foreign-language text.",
  },
  "frame-title": {
    plainLead: "An iframe may be missing a title (or accessible name).",
    whatHappens: "People may not know what embedded content is until they move inside it.",
    whoIsAffected: ["People who use screen readers", "Keyboard-only users"],
    whenYouFixIt: "Give the iframe a short title attribute that names the embed (e.g. “Company video”).",
  },
  "frame-title-unique": {
    plainLead: "Multiple iframes may share the same title.",
    whatHappens: "When several embeds sound identical, it is hard to pick the right one.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Make each iframe title unique and specific.",
  },
  "duplicate-id": {
    plainLead: "The same id appears more than once in the document.",
    whatHappens: "Labels, ARIA relationships, and scripts often target ids; duplicates break those links.",
    whoIsAffected: ["People who use screen readers", "People who use voice control"],
    whenYouFixIt: "Use each id only once, or switch to class names for styling hooks.",
  },
  "duplicate-id-active": {
    plainLead: "Duplicate ids may affect active elements.",
    whatHappens: "Assistive technology can associate the wrong label or description with a control.",
    whoIsAffected: ["People who use screen readers", "Voice control users"],
    whenYouFixIt: "Ensure every id in the DOM is unique.",
  },
  "duplicate-id-aria": {
    plainLead: "Duplicate ids can break ARIA references.",
    whatHappens: "aria-labelledby or aria-describedby may point at the wrong node.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Deduplicate ids so every referenced id points to one element.",
  },
  "heading-order": {
    plainLead: "Heading levels may skip a step (for example, h1 then h4).",
    whatHappens: "Many people navigate by headings; skipped levels feel like missing chapters.",
    whoIsAffected: ["People who use screen readers", "People who use reading aids"],
    whenYouFixIt: "Use a logical sequence (h1 → h2 → h3) that matches the visual outline.",
  },
  "empty-heading": {
    plainLead: "A heading element may have no readable text inside.",
    whatHappens: "Heading navigation can land on “blank” stops that waste time.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Put visible text in the heading or remove the heading role if it is decorative.",
  },
  "heading-has-content": {
    plainLead: "A heading may not expose any content to assistive technology.",
    whatHappens: "The outline users rely on can contain silent or confusing entries.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Ensure the heading has text or an accessible name.",
  },
  "page-has-heading-one": {
    plainLead: "The page may be missing a level-one heading.",
    whatHappens: "Screen reader users often jump to h1 to confirm they are on the right page.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Add a single h1 that describes the page’s primary purpose.",
  },
  "landmark-one-main": {
    plainLead: "The page may be missing a main landmark.",
    whatHappens: "Users may not have a quick way to skip chrome and jump to primary content.",
    whoIsAffected: ["People who use screen readers", "Keyboard-only users"],
    whenYouFixIt: "Wrap primary content in main (and only use one main per page unless documented).",
  },
  "landmark-no-duplicate-main": {
    plainLead: "There may be more than one main region.",
    whatHappens: "Multiple mains make “skip to main” unpredictable.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Keep a single main landmark for the primary content.",
  },
  "landmark-unique": {
    plainLead: "Two landmarks of the same type may share the same accessible name.",
    whatHappens: "Navigation menus can list two “navigation” regions that sound identical.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Give each landmark a unique aria-label or aria-labelledby.",
  },
  region: {
    plainLead: "A generic region may need an accessible name.",
    whatHappens: "Unnamed regions clutter the landmarks list without helping orientation.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Add aria-label / aria-labelledby or use a named landmark element.",
  },
  "meta-viewport": {
    plainLead: "The viewport meta tag may prevent zooming.",
    whatHappens: "Some users need to zoom text; blocking zoom is a hard failure for them.",
    whoIsAffected: ["People with low vision", "People with motor tremor who zoom for larger tap targets"],
    whenYouFixIt: "Allow user scaling in the viewport meta tag (avoid maximum-scale=1 or user-scalable=no).",
  },
  "meta-viewport-large": {
    plainLead: "The viewport may force a minimum scale that still blocks comfortable zoom.",
    whatHappens: "People who rely on pinch-zoom may not reach a usable text size.",
    whoIsAffected: ["People with low vision"],
    whenYouFixIt: "Relax minimum-scale so users can enlarge content.",
  },
  tabindex: {
    plainLead: "Tab order may be changed in a confusing way with tabindex.",
    whatHappens: "Positive tabindex values pull focus out of DOM order and can trap or disorient keyboard users.",
    whoIsAffected: ["Keyboard-only users", "People who use screen readers"],
    whenYouFixIt: "Prefer natural DOM order; avoid positive tabindex except rare, documented cases.",
  },
  "tabindex-unique": {
    plainLead: "Multiple elements may share the same positive tabindex.",
    whatHappens: "Focus order becomes unpredictable when tabindex values collide.",
    whoIsAffected: ["Keyboard-only users"],
    whenYouFixIt: "Remove duplicate positive tabindex values or eliminate them entirely.",
  },
  "scrollable-region-focusable": {
    plainLead: "A scrollable area may not be keyboard reachable.",
    whatHappens: "Keyboard users cannot scroll overflow content without a mouse.",
    whoIsAffected: ["Keyboard-only users", "Many screen reader users"],
    whenYouFixIt: "Ensure the scroll container can receive focus or use a visible scrollbar control.",
  },
  bypass: {
    plainLead: "The page may lack a way to skip repeated navigation blocks.",
    whatHappens: "Keyboard and screen reader users may tab through the same header on every page.",
    whoIsAffected: ["Keyboard-only users", "People who use screen readers"],
    whenYouFixIt: "Add a skip link or landmarks so users can jump straight to main content.",
  },
  list: {
    plainLead: "List markup may not match how the content is presented.",
    whatHappens: "Assistive technology may announce the wrong number of items or no list at all.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Use ul/ol/li (or correct ARIA list roles) that match the visual list.",
  },
  listitem: {
    plainLead: "A list item may sit outside a proper list container.",
    whatHappens: "Screen readers may not group related bullets the way sighted users see them.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Wrap items in ul/ol or fix invalid list nesting.",
  },
  "definition-list": {
    plainLead: "Definition list markup may be invalid or misused.",
    whatHappens: "Term/definition pairs may not be exposed as a coherent structure.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Use dt/dd inside dl, or switch to headings and paragraphs if that fits the design.",
  },
  dlitem: {
    plainLead: "A definition list item may be structured incorrectly.",
    whatHappens: "Terms and definitions can be announced out of order or without relationship.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Repair dl/dt/dd structure so each term pairs with its definition.",
  },
  "th-has-data-cells": {
    plainLead: "A table header may not match any data cells.",
    whatHappens: "Header associations can break, so column context is lost while reading cells.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Align th scope or headers/id so each header relates to real data cells.",
  },
  "td-headers-attr": {
    plainLead: "A cell’s headers attribute may point at invalid ids.",
    whatHappens: "Screen readers may not read the intended column or row headers.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Fix headers to reference existing th ids only.",
  },
  "scope-attr-valid": {
    plainLead: "A table header scope value may be invalid.",
    whatHappens: "Browsers may ignore the scope hint, so cells lose their header context.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Use scope=\"col\" or scope=\"row\" (or the correct headers pattern).",
  },
  "layout-table": {
    plainLead: "A layout table may expose table semantics that confuse navigation.",
    whatHappens: "Screen reader users may enter table reading mode for purely visual grids.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Use CSS for layout, or role=\"presentation\" on tables used only for layout.",
  },
  "aria-allowed-attr": {
    plainLead: "An ARIA attribute may not be allowed on this element’s role.",
    whatHappens: "Assistive technology may ignore the attribute or behave inconsistently.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Remove the invalid attribute or change the role to one that supports it.",
  },
  "aria-required-attr": {
    plainLead: "This role may be missing required ARIA attributes.",
    whatHappens: "Assistive technology may not expose the widget as interactive.",
    whoIsAffected: ["People who use screen readers", "Keyboard-only users"],
    whenYouFixIt: "Add the required properties listed in the ARIA spec for this role.",
  },
  "aria-required-children": {
    plainLead: "A composite widget may be missing required child roles.",
    whatHappens: "Menus, tabs, or trees can collapse into a generic “group” with no usable structure.",
    whoIsAffected: ["People who use screen readers", "Keyboard-only users"],
    whenYouFixIt: "Supply the missing child roles (e.g. menuitem inside menu).",
  },
  "aria-required-parent": {
    plainLead: "A widget may be missing its required parent role in the tree.",
    whatHappens: "The control may not be recognized as part of a tab list, menu, or tree.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Wrap the element in the correct parent role container.",
  },
  "aria-roles": {
    plainLead: "A role value may be invalid or unsupported.",
    whatHappens: "The element can fall back to a generic div with no intended semantics.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Use a valid ARIA role that matches the interaction pattern.",
  },
  "aria-valid-attr": {
    plainLead: "An ARIA attribute name may be misspelled or invalid.",
    whatHappens: "The attribute is ignored, so expected behavior never reaches assistive tech.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Fix typos and use only supported aria-* attributes.",
  },
  "aria-valid-attr-value": {
    plainLead: "An ARIA attribute may have a value that is not allowed.",
    whatHappens: "State like expanded, selected, or level may not be communicated.",
    whoIsAffected: ["People who use screen readers", "Keyboard-only users"],
    whenYouFixIt: "Correct the value to match the allowed tokens for that property.",
  },
  "aria-hidden-focus": {
    plainLead: "Focus may land on something marked as hidden from assistive technology.",
    whatHappens: "Keyboard users can tab to controls that screen readers treat as absent.",
    whoIsAffected: ["People who use screen readers", "Keyboard-only users"],
    whenYouFixIt: "Remove aria-hidden from focused descendants or remove the element from tab order.",
  },
  "aria-hidden-body": {
    plainLead: "The body may be hidden from assistive technology while the page is visible.",
    whatHappens: "The whole page can disappear from the accessibility tree.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Avoid aria-hidden on body; use inert or visibility patterns that preserve accessibility.",
  },
  "aria-prohibited-attr": {
    plainLead: "An ARIA attribute may be used where the host element forbids it.",
    whatHappens: "Conflicting native and ARIA semantics can produce contradictory announcements.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Remove the prohibited attribute or choose a different element pattern.",
  },
  "aria-command-name": {
    plainLead: "A command widget may lack an accessible name.",
    whoIsAffected: ["People who use screen readers", "Voice control users"],
    whenYouFixIt: "Name the control with visible text or aria-label.",
  },
  "aria-dialog-name": {
    plainLead: "A dialog may lack an accessible name.",
    whatHappens: "When a dialog opens, users may not hear what the modal is for.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Use aria-labelledby pointing at the dialog title, or aria-label.",
  },
  "aria-input-field-name": {
    plainLead: "A custom input may lack an accessible name.",
    whoIsAffected: ["People who use screen readers", "Voice control users"],
    whenYouFixIt: "Expose the same name sighted users infer from the label or placeholder.",
  },
  "aria-meter-name": {
    plainLead: "A meter may lack an accessible name.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Add a concise name and value information for the meter.",
  },
  "aria-progressbar-name": {
    plainLead: "A progress indicator may lack an accessible name.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Label what is progressing (e.g. “Upload progress”).",
  },
  "aria-toggle-field-name": {
    plainLead: "A toggle may lack an accessible name.",
    whoIsAffected: ["People who use screen readers", "Voice control users"],
    whenYouFixIt: "Make the on/off purpose clear in the accessible name.",
  },
  "aria-tooltip-name": {
    plainLead: "A tooltip may lack an accessible name.",
    whoIsAffected: ["People who use screen readers"],
    whenYouFixIt: "Ensure the tooltip trigger or surface has a name when it is interactive.",
  },
  "aria-treeitem-name": {
    plainLead: "A tree item may lack an accessible name.",
    whoIsAffected: ["People who use screen readers", "Keyboard-only users"],
    whenYouFixIt: "Give each node text or aria-label that matches the visible label.",
  },
  "aria-braille-equivalent": {
    plainLead: "Braille-related ARIA may be misconfigured.",
    whoIsAffected: ["People who use refreshable Braille with screen readers"],
    whenYouFixIt: "Follow ARIA guidance so braille content matches the intended message.",
  },
  autocomplete: {
    plainLead: "The autocomplete attribute may be incorrect or missing where it would help.",
    whatHappens: "Browsers cannot reliably suggest saved addresses or payment fields.",
    whoIsAffected: ["People with motor impairments who reuse autofill", "People who use password managers"],
    whenYouFixIt: "Use valid autocomplete tokens on inputs that collect standard data.",
  },
  "autocomplete-valid": {
    plainLead: "An autocomplete token may be invalid.",
    whoIsAffected: ["People who rely on browser autofill"],
    whenYouFixIt: "Use tokens from the HTML spec for the type of data you collect.",
  },
  "page-unreachable": {
    plainLead: "We could not fully analyze this page in the browser.",
    whatHappens: "Results may be incomplete or from a limited scan mode.",
    whoIsAffected: ["Everyone relying on this report"],
    whenYouFixIt: "Retry from a reachable URL or check whether the scanner is blocked.",
  },
};

function buildFallback(v: AuditViolation): HumanViolationContext {
  const desc = (v.description || "").trim();
  const plainLead = desc
    ? desc
    : "Automated testing flagged an accessibility issue on this page. The technical summary below has more detail.";

  return {
    plainLead,
    whoIsAffected: [
      "People who use assistive technology",
      "Keyboard-only users",
      "People who need predictable names and structure",
    ],
    whenYouFixIt:
      "Fixing it usually makes the interface clearer for everyone—not only for assistive technology.",
    fallback: true,
  };
}

/**
 * Returns human-centered strings for a violation. Always includes safe defaults for unknown rule ids.
 */
export function getHumanContextForViolation(v: AuditViolation): HumanViolationContext {
  const row = BY_RULE[v.id];
  if (row) {
    return { ...row, fallback: false };
  }
  return buildFallback(v);
}

/** Line for the “What happens for users” panel in ViolationWhereOnPage */
export function getWhatHappensLine(human: HumanViolationContext): string {
  return human.whatHappens ?? human.plainLead;
}
