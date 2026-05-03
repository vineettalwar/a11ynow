import { useState, useEffect } from "react";
import { CheckCircle2, Circle, ClipboardCopy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CheckItem {
  id: string;
  label: string;
  detail: string;
  ios?: boolean;
  android?: boolean;
}

const ITEMS: CheckItem[] = [
  {
    id: "touch-target",
    label: "Minimum touch target size",
    detail: "iOS: 44×44pt minimum. Android: 48×48dp minimum. Applies to all tappable elements.",
    ios: true, android: true,
  },
  {
    id: "vo-labels",
    label: "VoiceOver / TalkBack labels",
    detail: "Every interactive element has a meaningful accessible label. Images have alt text. Icons have aria-label.",
    ios: true, android: true,
  },
  {
    id: "dynamic-type",
    label: "Dynamic type / text scaling",
    detail: "Test at 200% system font size. No text is clipped, truncated, or overlapping.",
    ios: true, android: false,
  },
  {
    id: "text-scale",
    label: "Large text scaling",
    detail: "Test at 'Largest' font size in Accessibility settings. Layouts reflow rather than overflow.",
    ios: false, android: true,
  },
  {
    id: "colour-independent",
    label: "Colour-independent meaning",
    detail: "Status, errors, and categories are conveyed by text or icons, not colour alone.",
    ios: true, android: true,
  },
  {
    id: "focus-order",
    label: "Logical focus order",
    detail: "VoiceOver/TalkBack swipe order matches the visual reading order. Modals trap focus correctly.",
    ios: true, android: true,
  },
  {
    id: "gesture-alt",
    label: "Gesture alternatives",
    detail: "Every action reachable by a swipe or multi-finger gesture is also reachable by a single tap.",
    ios: true, android: true,
  },
  {
    id: "reduced-motion",
    label: "Reduced motion support",
    detail: "Animations and transitions are disabled or simplified when Reduce Motion is enabled.",
    ios: true, android: true,
  },
  {
    id: "switch-control",
    label: "Switch Control / Switch Access",
    detail: "All features are reachable and usable with Switch Control (iOS) or Switch Access (Android).",
    ios: true, android: true,
  },
  {
    id: "contrast",
    label: "Colour contrast",
    detail: "Text meets 4.5:1 AA contrast on all background colours, including over images.",
    ios: true, android: true,
  },
  {
    id: "error-labels",
    label: "Form error announcements",
    detail: "Validation errors are announced by VoiceOver/TalkBack - not just shown visually.",
    ios: true, android: true,
  },
  {
    id: "scrollview",
    label: "Scrollable regions labelled",
    detail: "Scrollable containers have an accessible label so screen readers announce them.",
    ios: true, android: true,
  },
];

type Platform = "ios" | "android";

const STORAGE_KEY = "accessibility-now:mobile-checklist";

function loadState(projectName: string, platform: Platform): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all[`${projectName}:${platform}`] || {};
  } catch { return {}; }
}

function saveState(projectName: string, platform: Platform, state: Record<string, boolean>) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[`${projectName}:${platform}`] = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export default function MobileChecklist() {
  const [platform, setPlatform] = useState<Platform>("ios");
  const [projectName, setProjectName] = useState("My app");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const visibleItems = ITEMS.filter((item) => item[platform] !== false);

  useEffect(() => {
    setChecks(loadState(projectName, platform));
  }, [projectName, platform]);

  const toggle = (id: string) => {
    const next = { ...checks, [id]: !checks[id] };
    setChecks(next);
    saveState(projectName, platform, next);
  };

  const reset = () => {
    setChecks({});
    saveState(projectName, platform, {});
  };

  const exportSummary = () => {
    const platformLabel = platform === "ios" ? "iOS" : "Android";
    const lines = [
      `Mobile Accessibility Checklist - ${platformLabel}`,
      `Project: ${projectName}`,
      `Date: ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`,
      "",
      ...visibleItems.map((s) => `[${checks[s.id] ? "✓" : " "}] ${s.label}`),
      "",
      `Passed: ${visibleItems.filter((s) => checks[s.id]).length} / ${visibleItems.length}`,
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const passCount = visibleItems.filter((s) => checks[s.id]).length;

  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Mobile accessibility<br />
            <span className="heading-accent">checklist.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            iOS and Android accessibility checklist. Results are saved per project in your browser - no account needed.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="space-y-6">
              <div>
                <label htmlFor="mc-project" className="block text-xs font-semibold font-sans uppercase tracking-widest text-muted-foreground mb-2">Project name</label>
                <Input
                  id="mc-project"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My app"
                  className="h-11"
                />
              </div>

              <div>
                <p className="block text-xs font-semibold font-sans uppercase tracking-widest text-muted-foreground mb-2" id="platform-label">Platform</p>
                <div className="flex rounded-xl border overflow-hidden" role="group" aria-labelledby="platform-label">
                  {(["ios", "android"] as Platform[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`flex-1 py-2.5 text-sm font-semibold font-sans transition-colors ${
                        platform === p ? "bg-foreground text-background" : "bg-background text-muted-foreground hover:text-foreground"
                      }`}
                      aria-pressed={platform === p}
                    >
                      {p === "ios" ? "🍎 iOS" : "🤖 Android"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-foreground text-background p-6">
                <p className="text-xs uppercase tracking-widest mb-2 text-background/60 font-sans">Progress</p>
                <p className="text-4xl font-extrabold font-sans">{passCount}<span className="text-background/40">/{visibleItems.length}</span></p>
                <div className="mt-3 h-2 rounded-full bg-background/20 overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(passCount / visibleItems.length) * 100}%` }} />
                </div>
                <p className="text-xs text-background/50 mt-2 font-sans">
                  {passCount === visibleItems.length ? "All checks passed!" : `${visibleItems.length - passCount} remaining`}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2 [box-shadow:none] text-sm" onClick={exportSummary}>
                  <ClipboardCopy className="w-4 h-4" />
                  {copied ? "Copied!" : "Copy summary"}
                </Button>
                <Button variant="outline" className="gap-2 [box-shadow:none] text-sm" onClick={reset} aria-label="Reset checklist">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              <div className="rounded-xl border p-4 bg-background text-xs text-muted-foreground">
                <p className="font-bold font-sans text-foreground mb-1.5">How to test</p>
                <p>Run through this checklist while using your app with VoiceOver (iOS) or TalkBack (Android) enabled. Tick each item as you verify it.</p>
              </div>
            </div>

            <div className="lg:col-span-2">
              <ol className="space-y-2" aria-label="Mobile accessibility checklist">
                {visibleItems.map((item, idx) => {
                  const done = !!checks[item.id];
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => toggle(item.id)}
                        className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all ${done ? "bg-green-50 border-green-200" : "bg-background border-border hover:border-muted-foreground"}`}
                        aria-pressed={done}
                      >
                        <span className="shrink-0 mt-0.5">
                          {done
                            ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                            : <Circle className="w-5 h-5 text-muted-foreground" />
                          }
                        </span>
                        <span className="flex-1">
                          <span className="text-xs text-muted-foreground font-sans mr-2">{idx + 1}.</span>
                          <strong className={`text-sm font-sans ${done ? "line-through text-muted-foreground" : ""}`}>{item.label}</strong>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
