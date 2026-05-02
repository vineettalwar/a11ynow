import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

const checklistItems = [
  "All non-text content (images, icons) has a text alternative (alt text).",
  "Pre-recorded audio/video includes captions and transcripts.",
  "Information, structure, and relationships are programmatic (semantic HTML).",
  "Content does not restrict its view and operation to a single display orientation.",
  "Colour is not used as the only visual means of conveying information.",
  "Text and images of text have a contrast ratio of at least 4.5:1.",
  "Text can be resized without assistive technology up to 200% without loss of content.",
  "All functionality is operable through a keyboard interface.",
  "Users have enough time to read and use content (no strict timeouts).",
  "Web pages have titles that describe topic or purpose.",
  "The purpose of each link can be determined from the link text alone.",
  "Any keyboard-operable UI has a visible focus indicator.",
  "The language of the page can be programmatically determined.",
  "When a component receives focus, it does not initiate a change of context.",
  "If an input error is automatically detected, it is identified and described in text.",
];

export default function EaaChecklist() {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const handleCheck = (index: number) => {
    setCheckedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progress = (completedCount / checklistItems.length) * 100;

  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            EAA Compliance<br />
            <span className="heading-accent">Checklist.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            A high-level diagnostic based on WCAG 2.1 AA requirements. Tick items as you verify them
            — this gives you a baseline view of your current posture.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-background border rounded-xl p-6 mb-8 sticky top-20 z-10">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-sm font-sans">Progress</h2>
              <span className="font-mono text-sm text-muted-foreground">
                {completedCount} / {checklistItems.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-3">
            {checklistItems.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 border rounded-xl hover:bg-background transition-colors"
              >
                <Checkbox
                  id={`item-${index}`}
                  className="mt-0.5 w-5 h-5 rounded-md shrink-0"
                  checked={checkedItems[index] || false}
                  onCheckedChange={() => handleCheck(index)}
                />
                <Label
                  htmlFor={`item-${index}`}
                  className="text-sm leading-relaxed cursor-pointer"
                  style={{ fontFamily: "var(--app-font-mono)" }}
                >
                  {item}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
