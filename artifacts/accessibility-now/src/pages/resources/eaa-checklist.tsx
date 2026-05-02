import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export default function EaaChecklist() {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const checklistItems = [
    "All non-text content (images, icons) has a text alternative (alt text).",
    "Pre-recorded audio/video includes captions and transcripts.",
    "Information, structure, and relationships are programmatic (semantic HTML).",
    "Content does not restrict its view and operation to a single display orientation.",
    "Color is not used as the only visual means of conveying information.",
    "Text and images of text have a contrast ratio of at least 4.5:1.",
    "Text can be resized without assistive technology up to 200 percent without loss of content.",
    "All functionality is operable through a keyboard interface.",
    "Users have enough time to read and use content (no strict timeouts).",
    "Web pages have titles that describe topic or purpose.",
    "The purpose of each link can be determined from the link text alone.",
    "Any keyboard operable user interface has a visible focus indicator.",
    "The language of the page can be programmatically determined.",
    "When a user interface component receives focus, it does not initiate a change of context.",
    "If an input error is automatically detected, the item is identified and the error is described in text."
  ];

  const handleCheck = (index: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progress = (completedCount / checklistItems.length) * 100;

  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-5xl font-bold mb-6">EAA Compliance Checklist</h1>
        <p className="text-xl text-muted-foreground">
          A high-level diagnostic checklist based on WCAG 2.1 AA requirements.
        </p>
      </div>

      <div className="bg-white border rounded-3xl p-8 mb-12 sticky top-24 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Your Progress</h2>
          <span className="font-mono">{completedCount} / {checklistItems.length}</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      <div className="space-y-6">
        {checklistItems.map((item, index) => (
          <div key={index} className="flex items-start gap-4 p-4 border rounded-xl hover:bg-gray-50 transition-colors">
            <Checkbox 
              id={`item-${index}`} 
              className="mt-1 w-6 h-6 rounded-md" 
              checked={checkedItems[index] || false}
              onCheckedChange={() => handleCheck(index)}
            />
            <Label 
              htmlFor={`item-${index}`} 
              className="text-lg leading-relaxed cursor-pointer font-medium"
            >
              {item}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
