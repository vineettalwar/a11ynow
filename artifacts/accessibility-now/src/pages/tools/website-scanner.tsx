import { useState } from "react";
import { useLocation } from "wouter";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Radar } from "lucide-react";

export default function WebsiteScannerTool() {
  const [url, setUrl] = useState("");
  const [strictProfile, setStrictProfile] = useState(false);
  const [multiViewport, setMultiViewport] = useState(true);
  const [, navigate] = useLocation();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = url.trim();
    if (!raw) return;
    const params = new URLSearchParams();
    params.set("url", raw);
    params.set("rescan", String(Date.now()));
    if (strictProfile) params.set("profile", "strict");
    if (multiViewport) params.set("multiViewport", "1");
    navigate(`/audit-result?${params.toString()}`);
  }

  return (
    <ToolPageLayout
      eyebrow="Playwright + axe · Optional multi-viewport"
      title={
        <>
          Website accessibility<br />
          <span className="heading-accent">scanner.</span>
        </>
      }
      description="Same engine as the homepage audit: headless Chromium scrolls the page, then axe runs WCAG-tagged rules. Turn on stricter tags or mobile + desktop passes when you need deeper signal."
      contentMaxWidth="max-w-3xl"
      innerClassName="space-y-8"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="ws-url" className="text-sm font-semibold font-sans">
            Page URL
          </Label>
          <Input
            id="ws-url"
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-12"
            autoComplete="url"
          />
        </div>

        <fieldset className="space-y-4 rounded-xl border-2 border-primary/15 bg-background/60 p-5">
          <legend className="text-sm font-bold font-sans px-1">Scan options</legend>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-border"
              checked={multiViewport}
              onChange={(e) => setMultiViewport(e.target.checked)}
            />
            <span>
              <span className="font-semibold font-sans text-sm">Mobile + desktop</span>
              <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Runs axe at ~390×844 and 1280×720, then merges findings. Slower, catches responsive-only issues.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-border"
              checked={strictProfile}
              onChange={(e) => setStrictProfile(e.target.checked)}
            />
            <span>
              <span className="font-semibold font-sans text-sm">Stricter axe profile</span>
              <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Adds AAA-oriented axe tags (where supported) on top of the default AA-oriented set.
              </span>
            </span>
          </label>
        </fieldset>

        <Button type="submit" disabled={!url.trim()} className="h-12 px-8 gap-2">
          <Radar className="w-4 h-4" aria-hidden />
          Run scan
        </Button>
      </form>

      <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-6">
        Console errors and failed requests are captured during the browser run when supported. They are hints only — not
        WCAG pass/fail. Automated checks still miss most of what a human audit covers.
      </p>
    </ToolPageLayout>
  );
}
