import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, ClipboardCopy, RotateCcw } from "lucide-react";

const IOS_STEPS = [
  { id: "k-skip", label: "Skip link", detail: "Press Tab once. Does a 'Skip to main content' link appear?" },
  { id: "k-tab-order", label: "Logical tab order", detail: "Tab through the page. Does focus move top-to-bottom, left-to-right?" },
  { id: "k-visible", label: "Focus visible", detail: "Is every focused element clearly highlighted? (Don't rely on browser default alone.)" },
  { id: "k-trap", label: "No keyboard trap", detail: "Tab into every modal and dropdown. Can you Tab out without pressing Escape?" },
  { id: "k-interactive", label: "All interactive elements reachable", detail: "Every button, link, input, and select must be reachable via Tab or Shift+Tab." },
  { id: "k-enter", label: "Enter activates buttons/links", detail: "Press Enter on focused buttons and links. Do they activate?" },
  { id: "k-space", label: "Space activates buttons/checkboxes", detail: "Press Space on focused buttons and checkboxes. Do they respond?" },
  { id: "k-arrow", label: "Arrow keys in widgets", detail: "Tab into radio groups, sliders, and tab panels. Do arrow keys navigate within them?" },
  { id: "k-escape", label: "Escape closes modals", detail: "Open a modal or popover, then press Escape. Does it close? Does focus return to the trigger?" },
  { id: "k-announce", label: "Dynamic changes announced", detail: "Submit a form or trigger an error. Is the result announced without a page reload?" },
];

const STORAGE_KEY = "accessibility-now:keyboard-tester";

function loadState(projectName: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all[projectName] || {};
  } catch { return {}; }
}

function saveState(projectName: string, state: Record<string, boolean>) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[projectName] = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export default function KeyboardTester() {
  const [url, setUrl] = useState("");
  const [loadedUrl, setLoadedUrl] = useState("");
  const [projectName, setProjectName] = useState("My project");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setChecks(loadState(projectName));
  }, [projectName]);

  const toggleCheck = (id: string) => {
    const next = { ...checks, [id]: !checks[id] };
    setChecks(next);
    saveState(projectName, next);
  };

  const reset = () => {
    setChecks({});
    saveState(projectName, {});
  };

  const handleLoadUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    let target = url;
    if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
    setLoadedUrl(target);
  };

  const exportSummary = () => {
    const lines = [
      `Keyboard Accessibility Test — ${projectName}`,
      `URL: ${loadedUrl || url || "(not set)"}`,
      `Date: ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`,
      "",
      ...IOS_STEPS.map((s) => `[${checks[s.id] ? "✓" : " "}] ${s.label}`),
      "",
      `Passed: ${IOS_STEPS.filter((s) => checks[s.id]).length} / ${IOS_STEPS.length}`,
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const passCount = IOS_STEPS.filter((s) => checks[s.id]).length;
  const total = IOS_STEPS.length;

  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Keyboard navigation<br />
            <span className="heading-accent">tester.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            Step-by-step keyboard testing guide with a persistent checklist. Test your site yourself — no extension needed.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label htmlFor="kt-project" className="block text-xs font-semibold font-sans uppercase tracking-widest text-muted-foreground mb-2">Project name</label>
                <Input
                  id="kt-project"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My project"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground mt-1.5">Results are saved per project name.</p>
              </div>

              <form onSubmit={handleLoadUrl} className="space-y-2">
                <label htmlFor="kt-url" className="block text-xs font-semibold font-sans uppercase tracking-widest text-muted-foreground">URL to test</label>
                <div className="flex gap-2">
                  <Input
                    id="kt-url"
                    type="url"
                    placeholder="https://your-website.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-11 flex-1"
                  />
                  <Button type="submit" className="h-11 px-4 shrink-0">Load</Button>
                </div>
                <p className="text-xs text-muted-foreground">Open the site below while running through the checklist, or open it in a separate tab.</p>
              </form>

              <div className="rounded-2xl bg-foreground text-background p-6">
                <p className="text-xs uppercase tracking-widest mb-2 text-background/60 font-sans">Progress</p>
                <p className="text-4xl font-extrabold font-sans">{passCount}<span className="text-background/40">/{total}</span></p>
                <div className="mt-3 h-2 rounded-full bg-background/20 overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(passCount / total) * 100}%` }} />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2 [box-shadow:none] text-sm" onClick={exportSummary}>
                  <ClipboardCopy className="w-4 h-4" />
                  {copied ? "Copied!" : "Export summary"}
                </Button>
                <Button variant="outline" className="gap-2 [box-shadow:none] text-sm" onClick={reset} aria-label="Reset checklist">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              <div className="rounded-xl border p-4 bg-background">
                <p className="text-xs font-bold font-sans mb-2">Testing tips</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li>Use <strong className="text-foreground">Tab</strong> to move forward, <strong className="text-foreground">Shift+Tab</strong> to go back.</li>
                  <li>Press <strong className="text-foreground">Enter</strong> to activate links and buttons.</li>
                  <li>Press <strong className="text-foreground">Space</strong> to activate buttons and checkboxes.</li>
                  <li>Use <strong className="text-foreground">Arrow keys</strong> in menus, radio groups, and sliders.</li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
              {loadedUrl && (
                <div className="rounded-2xl border overflow-hidden bg-muted">
                  <div className="px-3 py-2 border-b bg-background text-xs text-muted-foreground font-mono truncate">
                    {loadedUrl}
                  </div>
                  <iframe
                    src={loadedUrl}
                    title={`Keyboard testing frame — ${loadedUrl}`}
                    className="w-full h-[280px] border-0 block"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                  />
                </div>
              )}

              <div>
                <h2 className="text-base font-bold font-sans mb-4">Checklist</h2>
                <ol className="space-y-2">
                  {IOS_STEPS.map((step, idx) => {
                    const done = !!checks[step.id];
                    return (
                      <li key={step.id}>
                        <button
                          onClick={() => toggleCheck(step.id)}
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
                            <strong className={`text-sm font-sans ${done ? "line-through text-muted-foreground" : ""}`}>{step.label}</strong>
                            <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
