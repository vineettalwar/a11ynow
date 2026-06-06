import { Eye, MousePointer2, Brain, Wrench, type LucideIcon } from "lucide-react";

export type PourPrincipleName = "Perceivable" | "Operable" | "Understandable" | "Robust";

export interface PourPrincipleMeta {
  letter: string;
  name: PourPrincipleName;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  description: string;
  descriptionDe: string;
  whyItMatters: string;
}

export const POUR_PRINCIPLES: PourPrincipleMeta[] = [
  {
    letter: "P",
    name: "Perceivable",
    icon: Eye,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    description: "Information must be presentable in ways users can perceive — not invisible to all senses.",
    descriptionDe: "Informationen müssen so dargestellt werden, dass Nutzer sie wahrnehmen können.",
    whyItMatters: "Contrast, alt text, and reflow determine whether people with low vision or colour blindness can read your site.",
  },
  {
    letter: "O",
    name: "Operable",
    icon: MousePointer2,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    description: "UI and navigation must be operable — no interaction a user cannot perform.",
    descriptionDe: "Bedienung und Navigation müssen nutzbar sein — ohne unzumutbare Interaktion.",
    whyItMatters: "Keyboard access, focus order, and skip links are how motor-impaired and keyboard-only users reach your content.",
  },
  {
    letter: "U",
    name: "Understandable",
    icon: Brain,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    description: "Information and UI operation must be understandable — predictable and clear.",
    descriptionDe: "Inhalte und Bedienung müssen verständlich und vorhersehbar sein.",
    whyItMatters: "Labels, error messages, and language settings prevent confusion for cognitive and screen-reader users.",
  },
  {
    letter: "R",
    name: "Robust",
    icon: Wrench,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    description: "Content must be robust enough for assistive technologies to interpret reliably.",
    descriptionDe: "Inhalte müssen robust genug sein, damit assistive Technologien sie zuverlässig interpretieren.",
    whyItMatters: "Valid HTML, ARIA, and name/role/value ensure screen readers announce your UI correctly.",
  },
];

export const POUR_NAMES = POUR_PRINCIPLES.map((p) => p.name);
