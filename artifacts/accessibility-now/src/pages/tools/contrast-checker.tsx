import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Lightbulb } from "lucide-react";

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;
  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")
  );
}

function hexToHsl(hex: string): [number, number, number] {
  const rgb = hexToRgb(hex);
  if (!rgb) return [0, 0, 50];
  const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const hNorm = h / 360, sNorm = s / 100, lNorm = l / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (sNorm === 0) { r = g = b = lNorm; }
  else {
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    r = hue2rgb(p, q, hNorm + 1 / 3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1 / 3);
  }
  return rgbToHex(r * 255, g * 255, b * 255);
}

function suggestFix(fg: string, bg: string, targetRatio = 4.5): string {
  const [h, s, l] = hexToHsl(fg);
  const bgRgb = hexToRgb(bg);
  if (!bgRgb) return fg;
  const bgL = relativeLuminance(...bgRgb);
  const lighterBetter = bgL < 0.18;
  for (let step = 0; step <= 100; step += 0.5) {
    const newL = lighterBetter ? Math.min(100, l + step) : Math.max(0, l - step);
    const candidate = hslToHex(h, s, newL);
    if (contrastRatio(candidate, bg) >= targetRatio) return candidate;
  }
  return lighterBetter ? "#ffffff" : "#000000";
}

interface BadgeProps { label: string; pass: boolean; }
function Badge({ label, pass }: BadgeProps) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-medium font-sans ${pass ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}>
      {pass ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
      <span>{label}</span>
    </div>
  );
}

export default function ContrastChecker() {
  const [fg, setFg] = useState("#1a1a1a");
  const [bg, setBg] = useState("#f5f2ec");
  const [suggested, setSuggested] = useState<string | null>(null);

  const ratio = contrastRatio(fg, bg);
  const ratioDisplay = ratio.toFixed(2);

  const handleSuggest = useCallback(() => {
    setSuggested(suggestFix(fg, bg));
  }, [fg, bg]);

  const applyFix = () => {
    if (suggested) { setFg(suggested); setSuggested(null); }
  };

  const checks = [
    { label: "AA — Normal text (4.5:1)", pass: ratio >= 4.5 },
    { label: "AA — Large text (3:1)", pass: ratio >= 3 },
    { label: "AAA — Normal text (7:1)", pass: ratio >= 7 },
    { label: "AAA — Large text (4.5:1)", pass: ratio >= 4.5 },
    { label: "AA — UI components (3:1)", pass: ratio >= 3 },
  ];

  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Colour contrast<br />
            <span className="heading-accent">checker.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            WCAG 2.1 contrast ratio calculator. Real-time AA and AAA pass/fail with a one-click accessible colour suggestion.
          </p>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold font-sans uppercase tracking-widest text-muted-foreground mb-2">Foreground colour</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={fg}
                    onChange={(e) => { setFg(e.target.value); setSuggested(null); }}
                    className="w-12 h-12 rounded-lg border border-border cursor-pointer p-0.5 bg-white"
                    aria-label="Foreground colour"
                  />
                  <input
                    type="text"
                    value={fg}
                    onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) { setFg(e.target.value); setSuggested(null); } }}
                    className="flex-1 h-12 rounded-xl border border-border bg-input px-4 text-sm font-mono uppercase"
                    aria-label="Foreground hex value"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold font-sans uppercase tracking-widest text-muted-foreground mb-2">Background colour</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bg}
                    onChange={(e) => { setBg(e.target.value); setSuggested(null); }}
                    className="w-12 h-12 rounded-lg border border-border cursor-pointer p-0.5 bg-white"
                    aria-label="Background colour"
                  />
                  <input
                    type="text"
                    value={bg}
                    onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) { setBg(e.target.value); setSuggested(null); } }}
                    className="flex-1 h-12 rounded-xl border border-border bg-input px-4 text-sm font-mono uppercase"
                    aria-label="Background hex value"
                  />
                </div>
              </div>

              <div className="rounded-2xl border p-6 text-center" style={{ backgroundColor: bg }}>
                <p className="text-2xl font-extrabold font-sans mb-1" style={{ color: fg }}>Large heading text</p>
                <p className="text-sm" style={{ color: fg, fontFamily: "var(--app-font-mono)" }}>This is how body text looks with these colours. Readability matters.</p>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-foreground text-background p-6">
                <div>
                  <p className="text-xs font-sans uppercase tracking-widest text-background/60 mb-1">Contrast ratio</p>
                  <p className="text-4xl font-extrabold font-sans">{ratioDisplay}:1</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-bold font-sans ${ratio >= 4.5 ? "bg-green-500 text-white" : ratio >= 3 ? "bg-yellow-400 text-black" : "bg-red-500 text-white"}`}>
                  {ratio >= 4.5 ? "AA Pass" : ratio >= 3 ? "AA Large" : "Fail"}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2 [box-shadow:none]" onClick={handleSuggest}>
                  <Lightbulb className="w-4 h-4" /> Suggest AA fix
                </Button>
                {suggested && (
                  <Button className="flex-1 gap-2" onClick={applyFix} style={{ backgroundColor: suggested }}>
                    <span className="font-mono text-xs uppercase">{suggested}</span>
                    <span>— apply</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-base font-bold font-sans mb-4">WCAG pass/fail</h2>
              {checks.map(({ label, pass }) => (
                <Badge key={label} label={label} pass={pass} />
              ))}
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-sm font-bold font-sans mb-3">What these levels mean</h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li><strong className="text-foreground">AA Normal (4.5:1)</strong> — Required by EAA for body text under 18pt.</li>
                  <li><strong className="text-foreground">AA Large (3:1)</strong> — Required for text 18pt+ or 14pt bold.</li>
                  <li><strong className="text-foreground">AAA (7:1)</strong> — Gold standard. Not legally required but best practice.</li>
                  <li><strong className="text-foreground">UI Components (3:1)</strong> — Required for borders, icons, and focus rings.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
