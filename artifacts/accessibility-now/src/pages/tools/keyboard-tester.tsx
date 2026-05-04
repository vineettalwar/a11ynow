import { useState, useEffect, useRef, useCallback } from "react";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, ClipboardCopy, RotateCcw, Keyboard, ListChecks } from "lucide-react";

const CHECKLIST_STEPS = [
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

interface FocusLogEntry {
  idx: number;
  tag: string;
  role: string;
  name: string;
  timestamp: number;
}

type ToolMode = "live" | "checklist";

const FOCUS_OVERLAY_SCRIPT = `
(function() {
  if (window.__a11yOverlayActive) return;
  window.__a11yOverlayActive = true;

  var overlay = document.createElement('div');
  overlay.id = '__a11y_focus_ring';
  overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:3px solid #FF4D1C;border-radius:4px;box-shadow:0 0 0 2px rgba(255,77,28,0.3);transition:all 0.08s ease;outline:none;display:none;';
  document.body.appendChild(overlay);

  function updateOverlay(el) {
    if (!el || el === document.body || el === document.documentElement) {
      overlay.style.display = 'none';
      return;
    }
    var rect = el.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.left = (rect.left - 4) + 'px';
    overlay.style.top = (rect.top - 4) + 'px';
    overlay.style.width = (rect.width + 8) + 'px';
    overlay.style.height = (rect.height + 8) + 'px';

    var tag = el.tagName.toLowerCase();
    var role = el.getAttribute('role') || '';
    if (!role) {
      var tagRoles = {button:'button',a:'link',input:'textbox',select:'combobox',textarea:'textbox',nav:'navigation',main:'main',header:'banner',footer:'contentinfo'};
      var t = el.getAttribute('type') || '';
      if (tag === 'input' && t === 'checkbox') role = 'checkbox';
      else if (tag === 'input' && t === 'radio') role = 'radio';
      else if (tag === 'input' && (t === 'submit' || t === 'button' || t === 'reset')) role = 'button';
      else role = tagRoles[tag] || tag;
    }
    var name = el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || el.getAttribute('placeholder') || el.getAttribute('value') || '';
    name = name.replace(/\\s+/g,' ').trim().slice(0, 60);

    window.parent.postMessage({type:'__a11y_focus',tag:tag,role:role,name:name},'*');
  }

  document.addEventListener('focusin', function(e) { updateOverlay(e.target); }, true);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') { setTimeout(function(){ updateOverlay(document.activeElement); }, 50); }
  }, true);
})();
`;

export default function KeyboardTester() {
  const [url, setUrl] = useState("");
  const [loadedUrl, setLoadedUrl] = useState("");
  const [projectName, setProjectName] = useState("My project");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [toolMode, setToolMode] = useState<ToolMode>("checklist");
  const [focusLog, setFocusLog] = useState<FocusLogEntry[]>([]);
  const [tabCount, setTabCount] = useState(0);
  const [scriptInjected, setScriptInjected] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const focusLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChecks(loadState(projectName));
  }, [projectName]);

  const handleMessage = useCallback((e: MessageEvent) => {
    if (!e.data || e.data.type !== "__a11y_focus") return;
    const { tag, role, name } = e.data;
    setTabCount((c) => {
      const idx = c + 1;
      setFocusLog((prev) => {
        const entry: FocusLogEntry = { idx, tag, role, name, timestamp: Date.now() };
        const next = [entry, ...prev].slice(0, 40);
        return next;
      });
      return idx;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  useEffect(() => {
    if (focusLogRef.current) {
      focusLogRef.current.scrollTop = 0;
    }
  }, [focusLog]);

  const injectOverlay = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc || doc.readyState === "loading") return;
      const s = doc.createElement("script");
      s.textContent = FOCUS_OVERLAY_SCRIPT;
      (doc.head || doc.body || doc.documentElement).appendChild(s);
      setScriptInjected(true);
    } catch {
      setScriptInjected(false);
    }
  }, []);

  const handleLoadUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    let target = url;
    if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
    setLoadedUrl(target);
    setFocusLog([]);
    setTabCount(0);
    setScriptInjected(false);
  };

  const handleIframeLoad = () => {
    if (toolMode === "live") injectOverlay();
  };

  useEffect(() => {
    if (toolMode === "live" && loadedUrl) injectOverlay();
  }, [toolMode, loadedUrl, injectOverlay]);

  const toggleCheck = (id: string) => {
    const next = { ...checks, [id]: !checks[id] };
    setChecks(next);
    saveState(projectName, next);
  };

  const reset = () => {
    setChecks({});
    saveState(projectName, {});
  };

  const exportSummary = () => {
    const lines = [
      `Keyboard Accessibility Test - ${projectName}`,
      `URL: ${loadedUrl || url || "(not set)"}`,
      `Date: ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`,
      "",
      ...CHECKLIST_STEPS.map((s) => `[${checks[s.id] ? "✓" : " "}] ${s.label}`),
      "",
      `Passed: ${CHECKLIST_STEPS.filter((s) => checks[s.id]).length} / ${CHECKLIST_STEPS.length}`,
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const passCount = CHECKLIST_STEPS.filter((s) => checks[s.id]).length;

  return (
    <ToolPageLayout
      eyebrow="Live page · Checklist export"
      title={
        <>
          Keyboard navigation<br />
          <span className="heading-accent">tester.</span>
        </>
      }
      description="Two modes: Live overlay mode tracks focused elements in real-time as you Tab through a page. Checklist mode guides you through manual testing with a persistent, exportable checklist."
      contentMaxWidth="max-w-5xl"
      innerClassName="space-y-8"
    >
          <div className="flex flex-wrap items-center gap-4">
            <form onSubmit={handleLoadUrl} className="flex gap-2 flex-1 min-w-0 max-w-xl">
              <label htmlFor="kt-url" className="sr-only">Website URL</label>
              <Input
                id="kt-url"
                type="url"
                placeholder="https://your-website.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-11 flex-1"
              />
              <Button type="submit" className="h-11 px-4 shrink-0">Load</Button>
            </form>

            <div className="flex rounded-xl border overflow-hidden shrink-0" role="group" aria-label="Tool mode">
              <button
                onClick={() => setToolMode("live")}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium font-sans transition-colors ${toolMode === "live" ? "bg-foreground text-background" : "bg-background text-muted-foreground hover:text-foreground"}`}
                aria-pressed={toolMode === "live"}
              >
                <Keyboard className="w-4 h-4" /> Live overlay
              </button>
              <button
                onClick={() => setToolMode("checklist")}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium font-sans transition-colors ${toolMode === "checklist" ? "bg-foreground text-background" : "bg-background text-muted-foreground hover:text-foreground"}`}
                aria-pressed={toolMode === "checklist"}
              >
                <ListChecks className="w-4 h-4" /> Checklist
              </button>
            </div>
          </div>

          {toolMode === "live" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                <div className="rounded-2xl border overflow-hidden bg-muted">
                  <div className="px-3 py-2 border-b bg-background flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground truncate">{loadedUrl || "No URL loaded"}</span>
                    {loadedUrl && (
                      <span className={`text-xs font-medium font-sans px-2 py-0.5 rounded-full ${scriptInjected ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {scriptInjected ? "Overlay active" : "Same-origin only"}
                      </span>
                    )}
                  </div>
                  {!loadedUrl && (
                    <div className="h-[360px] flex flex-col items-center justify-center text-center px-6">
                      <Keyboard className="w-10 h-10 text-muted-foreground mb-3" />
                      <p className="text-sm font-semibold font-sans mb-1">Load a URL to begin</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        The live overlay works on same-origin pages. For cross-origin sites, the overlay won't inject - use Checklist mode instead.
                      </p>
                    </div>
                  )}
                  {loadedUrl && (
                    <iframe
                      ref={iframeRef}
                      key={loadedUrl}
                      src={loadedUrl}
                      title={`Keyboard testing - ${loadedUrl}`}
                      className="w-full border-0 h-[360px] block"
                      onLoad={handleIframeLoad}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Click inside the frame, then press <kbd className="font-mono bg-muted border border-border px-1.5 py-0.5 rounded text-foreground">Tab</kbd> to step through focusable elements. The orange ring tracks focus position.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-foreground text-background p-5">
                  <p className="text-xs uppercase tracking-widest text-background/50 mb-1 font-sans">Tab presses logged</p>
                  <p className="text-4xl font-extrabold font-sans">{tabCount}</p>
                </div>

                <div className="rounded-xl border overflow-hidden">
                  <div className="px-3 py-2 border-b bg-muted text-xs font-semibold font-sans text-muted-foreground uppercase tracking-widest">
                    Focus log
                  </div>
                  <div
                    ref={focusLogRef}
                    className="h-[260px] overflow-y-auto"
                    aria-live="polite"
                    aria-label="Focus event log"
                  >
                    {focusLog.length === 0 && (
                      <div className="flex items-center justify-center h-full text-xs text-muted-foreground text-center px-4">
                        Focus events will appear here as you Tab through the page.
                      </div>
                    )}
                    {focusLog.map((entry) => (
                      <div key={entry.idx} className="flex items-start gap-2 px-3 py-2 border-b last:border-b-0 hover:bg-muted/50">
                        <span className="text-xs text-muted-foreground font-mono shrink-0 pt-0.5">#{entry.idx}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-foreground text-background text-xs font-mono">{entry.tag}</span>
                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-sans font-medium">{entry.role}</span>
                          </div>
                          {entry.name && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.name}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full gap-2 [box-shadow:none] text-sm"
                  onClick={() => { setFocusLog([]); setTabCount(0); }}
                >
                  <RotateCcw className="w-4 h-4" /> Clear log
                </Button>

                <div className="rounded-xl border p-4 bg-background">
                  <p className="text-xs font-bold font-sans mb-2">Cross-origin note</p>
                  <p className="text-xs text-muted-foreground">The overlay script can only inject into same-origin frames. For sites with different domains, use the Checklist mode instead.</p>
                </div>
              </div>
            </div>
          )}

          {toolMode === "checklist" && (
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
                  <p className="text-xs text-muted-foreground mt-1.5">Progress saved per project in your browser.</p>
                </div>

                <div className="rounded-2xl bg-foreground text-background p-6">
                  <p className="text-xs uppercase tracking-widest mb-2 text-background/60 font-sans">Progress</p>
                  <p className="text-4xl font-extrabold font-sans">{passCount}<span className="text-background/40">/{CHECKLIST_STEPS.length}</span></p>
                  <div className="mt-3 h-2 rounded-full bg-background/20 overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(passCount / CHECKLIST_STEPS.length) * 100}%` }} />
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

              <div className="lg:col-span-3">
                <h2 className="text-base font-bold font-sans mb-4">Checklist</h2>
                <ol className="space-y-2">
                  {CHECKLIST_STEPS.map((step, idx) => {
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
          )}
    </ToolPageLayout>
  );
}
